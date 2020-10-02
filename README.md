# Code Climate

> Uploads code coverage information to Code Climate.

## About

This action interacts with [Code Climate](https://codeclimate.com/) reporter and allows you to upload your code coverage reports seamlessly.

## Usage

```yml
name: Test
on: [push, pull_request]
jobs:
  run-tests:
    runs-on: ubuntu-latest
    steps:
      - name: before_build
        uses: caffco/code-climate-github-action@v1.0.0
        with:
          run_before_build: 'true'
        env:
          CC_TEST_REPORTER_ID: ${{ secrets.CC_TEST_REPORTER_ID }}
      - name: Run tests
        run: yarn test --coverage
      - name: collect_coverage
        uses: caffco/code-climate-github-action@v1.0.0
        with:
          collect_coverage: 'true'
          coverage_file_patterns: |
            **/*.lcov:lcov
      - name: after_build
        uses: caffco/code-climate-github-action@v1.0.0
        with:
          run_after_build: 'true'
```
