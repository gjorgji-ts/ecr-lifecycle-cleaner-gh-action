# ECR Lifecycle Cleaner GitHub Action

[![GitHub Super-Linter](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner-gh-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner-gh-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner-gh-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner-gh-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner-gh-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner-gh-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action for managing lifecycle policies and cleaning up orphaned images
in AWS ECR. This action is designed to be used in a scheduled workflow to
enforce lifecycle policies on ECR repositories and clean up orphaned images.

## Prerequisites

- AWS credentials configured (via
  [configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials))
- AWS necessary permissions:
  - **sts:GetCallerIdentity** -- Allows the tool to identify the AWS account
    being used, which is required for the ECR API calls.
  - **ecr:DescribeRepositories** -- Allows the tool to list all the repositories
    in the account, which is required for the `--allRepos` flag.
  - **ecr:ListImages** -- Allows the tool to list all the images in a
    repository, which is required for the `clean` command.
  - **ecr:BatchGetImage** -- Allows the tool to get the image details, which is
    required for the `clean` command.
  - **ecr:BatchDeleteImage** -- Allows the tool to delete the images, which is
    required for the `clean` command.
  - **ecr:GetLifecyclePolicy** -- Allows the tool to get the existing lifecycle
    policy, which is required for the `setPolicy` command.
  - **ecr:PutLifecyclePolicy** -- Allows the tool to set the lifecycle policy,
    which is required for the `setPolicy` command.

## Features

- Apply lifecycle policies to ECR repositories
- Clean up orphaned or unused ECR images
- Support for targeting specific repositories or all repositories
- Dry run capability for safe execution

## Inputs

| Input                           | Description                                                             | Required                 | Default |
| ------------------------------- | ----------------------------------------------------------------------- | ------------------------ | ------- |
| `ecr-lifecycle-cleaner-version` | Version of the ECR Lifecycle Cleaner CLI to use                         | Yes                      | N/A     |
| `command`                       | The command to run: `clean` or `setPolicy`                              | Yes                      | N/A     |
| `dry-run`                       | Whether to perform a dry run without making changes                     | No                       | `true`  |
| `all-repos`                     | Whether to apply the command to all repositories                        | No                       | `false` |
| `repo-list`                     | Comma-separated list of repository names to include                     | No                       | N/A     |
| `repo-pattern`                  | Regular expression pattern to match repository names                    | No                       | N/A     |
| `policy-file`                   | Path to the lifecycle policy JSON file (required for setPolicy command) | Required for `setPolicy` | N/A     |

## Example Workflows

### Clean Up Orphaned Images

```yaml
name: Clean ECR Orphaned Images

on:
  schedule:
    - cron: '0 0 * * 0'
  workflow_dispatch:

jobs:
  clean-ecr:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Clean ECR Repositories
        uses: gjorgji-ts/ecr-lifecycle-cleaner-gh-action@v1.1.0
        with:
          ecr-lifecycle-cleaner-version: '1.2.1'
          command: 'clean'
          dry-run: 'false'
          all-repos: 'true'
```

### Apply Lifecycle Policy to Specific Repositories

```yaml
name: Apply ECR Lifecycle Policy

on:
  workflow_dispatch:

jobs:
  apply-policy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Apply Lifecycle Policy
        uses: gjorgji-ts/ecr-lifecycle-cleaner-gh-action@v1.1.0
        with:
          ecr-lifecycle-cleaner-version: '1.2.1'
          command: 'setPolicy'
          dry-run: 'false'
          repo-list: 'app-repo-1,app-repo-2'
          policy-file: './policies/lifecycle-policy.json'
```

### Apply Policy Using Repository Pattern

```yaml
name: Apply ECR Policy by Pattern

on:
  workflow_dispatch:

jobs:
  apply-policy-pattern:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Apply Policy to Matching Repositories
        uses: gjorgji-ts/ecr-lifecycle-cleaner-gh-action@v1.1.0
        with:
          ecr-lifecycle-cleaner-version: '1.2.1'
          command: 'setPolicy'
          dry-run: 'false'
          repo-pattern: '^app-.*-prod$'
          policy-file: './policies/lifecycle-policy.json'
```

## Security Considerations

- Always run with `dry-run: 'true'` first to verify changes
- Use specific IAM roles/permissions following the principle of least privilege
- Consider using OpenID Connect (OIDC) for secure, token-based authentication
  with AWS

## Under the Hood

This action uses the
[ECR Lifecycle Cleaner CLI](https://github.com/gjorgji-ts/ecr-lifecycle-cleaner)
to manage ECR repositories and images.

## License

See the [LICENSE](LICENSE) file for details.
