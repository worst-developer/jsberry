const http = require('http');
const path = require('path');
const hpp = require('hpp');
const cors = require('cors');
const helmet = require('helmet');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const corsOptions = {};
const server = http.createServer(app);

module.exports = ({ ACTIONS, ROUTER }) => {

  /**
   * Access headers
   *
   * @param {Object} options - config for express application
   * @param {Object} req - express request object
   * @param {Object} res - express response object
   * @param {function()} next callback
   */

  ACTIONS.on('api.access.headers', (options) => {

    corsOptions.origin = options.origin;
    corsOptions.allowedHeaders = options.headers;
    corsOptions.methods = options.methods;

  });

  ACTIONS.on('api.configure', () => {

    const serverPath = path.dirname(require.main.filename);

    app.use(helmet());
    app.use(cors(corsOptions));
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
    app.use(hpp()); // app.get('/url', hpp({ whitelist: [ 'key' ] }));
    app.use(express.static(path.join(serverPath, '../../public')));

    app.get('/', (req, res) => {

      res.sendFile(path.join(serverPath, '../../public'));

    });

  });

  ACTIONS.on('api.routes', () => {

    for (let _route in ROUTER.routes) {

      const route = ROUTER.routes[_route];

      app[route.method](`/${route.path}`, (req, res, next) => {

        const props = { headers: req.headers, data: req.query, body: req.body };

        ACTIONS.send(_route.replace('_', '.'), props)
          .then((data) => res.send(data))
          .catch((error) => next(error));

      });

    }

  });

  ACTIONS.on('api.create.server', (options) => {

    server.listen(options.port, () => {

      console.log(`${options.name} ----- API running at :${options.port} port`);

    });

    return Promise.resolve();

  });

  // Some magic for clean unstoppable functions (for ex. listen port)

  ACTIONS.on('clear.api', () => {

    server.close();

  });

};