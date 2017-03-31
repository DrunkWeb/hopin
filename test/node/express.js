const path = require('path');
const fetch = require('node-fetch');

require('chai').should();

const testRoute = (route, expectedText) => {
  return fetch(route)
  .then((result) => {
    // if(!result.ok) {
    //   throw new Error(`Result not OK - '${route}'`);
    // }

    return result.text()
    .then((responseText) => {
      responseText.should.equal(expectedText);
    });
  });
};

describe('Test Express Usage', function() {
  it('should pass calls to router', function() {
    const Hopin = require('../../src/index');
    const server = new Hopin({
      relativePath: path.join(__dirname, '..', 'static', 'basic-example'),
    });
    return server.startServer(3000)
    .then((addressInfo) => {
      const serverUrl = `http://localhost:${addressInfo.port}`;
      return testRoute(`${serverUrl}/`, 'basic-example:home')
      .then(() => {
        return testRoute(`${serverUrl}/test`, 'basic-example:test');
      })
      .then(() => {
        return testRoute(`${serverUrl}/test/action`, 'basic-example:test:action');
      });
    });
  });
});