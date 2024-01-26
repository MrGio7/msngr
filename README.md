# Msngr

Msngr is a simple, super scalable messaging application that leverages cloud services for autoscaling.

## Features

- Highly scalable: Msngr can handle a large number of users and messages without compromising performance.
- Cloud-based: Msngr uses various AWS services, ensuring reliability and robustness.

## Tech Stack

- **Backend**: AWS Lambda, API Gateway (HTTP API, Websockets), CloudFront, S3, Route53, Certificate Manager.
- **Server**: tRPC Lambda server.
- **Frontend**: React Vite, hosted on S3.

## Getting Started

Follow these steps to set up and run Msngr locally:

### Prerequisites

- Docker
- AWS account
- AWS CDK
- Environment variables set based on `.env.example`
- Updated content in the `config` folder

### Setup

1. Clone the repository: `git clone <repository-url>`
2. Install dependencies: `npm ci`
3. Bootstrap the CDK: `cdk bootstrap`
4. Deploy the application: `npm run deploy`
5. After deployment, edit the API target path in `vite.config`
6. You can now test your app locally by running `npm run dev` or test the deployed app

## Contributing

Contributions are welcome! Please read the contributing guidelines before getting started.

## License

This project is licensed under the terms of the MIT license.
