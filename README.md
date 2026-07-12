# FloatChat
AI-Powered Conversational Interface for ARGO Ocean Data Discovery and Visualization

## Description

FloatChat is an AI-powered conversational interface for ARGO Ocean Data Discovery and Visualization.

The system is organized as a monorepo with the following primary components:
- [FastAPI API](./packages/api-fastapi) - The backend service.
- [React Webapp](./packages/website) - The frontend interface.

## Development

The app is a monorepo managed by [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/). Individual packages are found in the `./packages` directory.

### Getting Started

To get started, run `yarn install` from this directory. This will install all dependencies for all the packages. You will also need to do some package-specific configuration such as setting up a `.env` file for environment variables - see the individual package READMEs for details on this process.

### Running Commands

```bash
# Build all of the packages
yarn build

# Run tests for all of the packages
yarn test

# Start up all of the packages locally
yarn start

# Lint all the files in the app
yarn lint:all
```

## Contributing

Contributions from developers and scientists are welcome!

## License

FloatChat is [MIT licensed](LICENSE).
