import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { HttpApi, WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { HttpLambdaIntegration, WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { AllowedMethods, CachePolicy, Distribution, OriginRequestPolicy, ResponseHeadersPolicy, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin, S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Code, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { z } from "zod";

require("dotenv").config();

const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REDIRECT_URL: z.string().min(1),
    ACCESS_TOKEN_SECRET: z.string().min(1),
    TICKET_SECRET: z.string().min(1),
    RAT_TOKEN: z.string().min(1),
    AWS_CERTIFICATE_ARN: z.string().min(1),
  })
  .parse(process.env);

export class MsngrStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const prismaClientLayer = new LayerVersion(this, "prisma-client-layer", {
      code: Code.fromAsset("layers"),
    });

    const serverFunction = new NodejsFunction(this, "msngr-server", {
      functionName: "msngr-server",
      entry: "services/lambda/server/handler.ts",
      bundling: { externalModules: ["@aws-sdk/*", "/opt/*"] },
      environment: {
        DATABASE_URL: env.DATABASE_URL,
        GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URL: env.GOOGLE_REDIRECT_URL,
        ACCESS_TOKEN_SECRET: env.ACCESS_TOKEN_SECRET,
        TICKET_SECRET: env.TICKET_SECRET,
      },
      layers: [prismaClientLayer],
      logRetention: RetentionDays.ONE_WEEK,
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(60),
      memorySize: 512,
    });

    const serverAuthorizerFunction = new NodejsFunction(this, "msngr-server-authorizer", {
      functionName: "msngr-server-authorizer",
      entry: "services/lambda/server/authorizer.ts",
      bundling: { externalModules: ["@aws-sdk/*", "/opt/*"] },
      environment: {
        RAT_TOKEN: env.RAT_TOKEN,
      },
      logRetention: RetentionDays.ONE_WEEK,
      runtime: Runtime.NODEJS_20_X,
    });

    const httpApi = new HttpApi(this, "msngr-server-api", {
      apiName: "msngr-server",
      defaultAuthorizer: new HttpLambdaAuthorizer("msngr-server-authorizer", serverAuthorizerFunction, {
        responseTypes: [HttpLambdaResponseType.SIMPLE],
        identitySource: ["$request.header.x-rat-token"],
      }),
    });

    httpApi.addRoutes({
      integration: new HttpLambdaIntegration("msngr-server-api-integration", serverFunction),
      path: "/api/{proxy+}",
    });

    const connectFunction = new NodejsFunction(this, "msngr-connect", {
      functionName: "msngr-connect",
      entry: "services/lambda/connect.ts",
      logRetention: RetentionDays.ONE_WEEK,
      bundling: { externalModules: ["@aws-sdk/*", "/opt/*"] },
      environment: {
        DATABASE_URL: env.DATABASE_URL,
        TICKET_SECRET: env.TICKET_SECRET,
      },
      layers: [prismaClientLayer],
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(60),
      memorySize: 512,
    });

    const disconnectFunction = new NodejsFunction(this, "msngr-disconnect", {
      functionName: "msngr-disconnect",
      entry: "services/lambda/disconnect.ts",
      logRetention: RetentionDays.ONE_WEEK,
      bundling: { externalModules: ["@aws-sdk/*", "/opt/*"] },
      environment: {
        DATABASE_URL: env.DATABASE_URL,
      },
      layers: [prismaClientLayer],
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(60),
      memorySize: 512,
    });

    const defaultFunction = new NodejsFunction(this, "msngr-default", {
      functionName: "msngr-default",
      entry: "services/lambda/default.ts",
      logRetention: RetentionDays.ONE_WEEK,
    });

    const wsApi = new WebSocketApi(this, "msngr-ws-api", {
      apiName: "msngr-ws",
      routeSelectionExpression: "$request.body.action",
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration("connectIntegration", connectFunction),
        returnResponse: true,
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration("disconnectIntegration", disconnectFunction),
        returnResponse: true,
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration("defaultIntegration", defaultFunction),
        returnResponse: true,
      },
    });

    const wsApiStage = new WebSocketStage(this, "msngr-ws-stage", {
      webSocketApi: wsApi,
      stageName: "prod",
      autoDeploy: true,
    });

    wsApi.grantManageConnections(serverFunction);
    wsApiStage.grantManagementApiAccess(serverFunction);

    const staticBucket = new Bucket(this, "msngr-static-bucket", {
      bucketName: "msngr.gbdev.click",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const staticBucketDeployment = new BucketDeployment(this, "msngr-static-bucket-deployment", {
      sources: [Source.asset("services/web/dist")],
      destinationBucket: staticBucket,
    });

    const cloudfront = new Distribution(this, "msngr-cloudfront", {
      comment: "msngr",
      defaultRootObject: "index.html",
      domainNames: ["msngr.gbdev.click"],
      certificate: Certificate.fromCertificateArn(this, "msngr-cloudfront-certificate", env.AWS_CERTIFICATE_ARN),
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/",
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/",
        },
      ],
      defaultBehavior: {
        origin: new S3Origin(staticBucket),
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        "/api/*": {
          origin: new HttpOrigin(`${httpApi.apiId}.execute-api.${this.region}.amazonaws.com`, {
            customHeaders: {
              "x-rat-token": env.RAT_TOKEN,
            },
          }),
          cachePolicy: CachePolicy.CACHING_DISABLED,
          originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          responseHeadersPolicy: ResponseHeadersPolicy.SECURITY_HEADERS,
        },
      },
    });

    new ARecord(this, "msngr-cloudfront-record", {
      zone: HostedZone.fromHostedZoneAttributes(this, "msngr-hosted-zone", {
        hostedZoneId: "Z0807168312RCW8UVTKW0",
        zoneName: "gbdev.click",
      }),
      target: RecordTarget.fromAlias(new CloudFrontTarget(cloudfront)),
      recordName: "msngr.gbdev.click",
    });
  }
}
