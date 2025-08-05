[![Maintainability][maintainabilityimageurl]](https://codeclimate.com/github/caffco/code-climate-github-action/maintainability)
[![Test Coverage][testcoverageimageurl]]([https://codeclimate.com/github/caffco/code-climate-github-action/test_coverage])

# Code Climate

> Uploads code coverage information to Code Climate.

## About

This action interacts with [Code Climate](https://codeclimate.com/) reporter and
allows you to upload your code coverage reports seamlessly.

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
        env:
          CC_TEST_REPORTER_ID: ${{ secrets.CC_TEST_REPORTER_ID }}
        with:
          run_before_build: 'true'
      - name: Run tests
        run: yarn test --coverage
      - name: collect_coverage
        uses: caffco/code-climate-github-action@v1.0.0
        env:
          CC_TEST_REPORTER_ID: ${{ secrets.CC_TEST_REPORTER_ID }}
        with:
          collect_coverage: 'true'
          coverage_file_patterns: |
            **/*.lcov:lcov
      - name: after_build
        uses: caffco/code-climate-github-action@v1.0.0
        env:
          CC_TEST_REPORTER_ID: ${{ secrets.CC_TEST_REPORTER_ID }}
        with:
          run_after_build: 'true'
```

[maintainabilityimageurl]: https://api.codeclimate.com/v1/badges/f28434b0cf06574fb720/maintainability
[testcoverageimageurl]: https://api.codeclimate.com/v1/badges/f28434b0cf06574fb720/test_coverage
