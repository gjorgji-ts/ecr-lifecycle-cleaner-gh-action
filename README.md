# ECR Lifecycle Cleaner GitHub Action

[![GitHub Super-Linter](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner-gh-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner-gh-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner-gh-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner-gh-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner-gh-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner-gh-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action for managing lifecycle policies and cleaning up orphaned images
in AWS ECR. This action is designed to be used in a scheduled workflow to
enforce lifecycle policies on ECR repositories and clean up orphaned images. It
uses the
[ECR Lifecycle Cleaner CLI](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner)
under the hood.

## Usage

> [!NOTE]
>
> This action should be used after the
> [configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)
> action to configure the AWS credentials. This will set the AWS credentials in
> the environment variables and the ECR Lifecycle Cleaner CLI will use them to
> authenticate with AWS.
