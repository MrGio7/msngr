import "source-map-support/register";

import { App } from "aws-cdk-lib";
import { MsngrStack } from "../lib/msngr.stack";

require("dotenv").config();

export const app = new App();

new MsngrStack(app, "MsngrStack");
