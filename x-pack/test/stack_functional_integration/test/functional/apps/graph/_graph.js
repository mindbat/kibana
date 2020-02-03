/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from '@kbn/expect';

const noop = () => {};

export default ({ getService, getPageObjects }) => {
  describe('creating a simple graph', function describeGraphTests() {
    const PageObjects = getPageObjects(['visualize', 'graph', 'settings', 'common']);
    const log = getService('log');

    before(function() {
      return PageObjects.common
        .try(() => {
          // return elasticDump.elasticLoad('secrepo', 'secrepo');
          return noop();
        })
        .then(() => {
          return PageObjects.settings.createIndexPattern('secrepo');
        })
        .then(() => {
          return PageObjects.common.navigateToApp('graph');
        });
    });

    const graphName = 'my Graph workspace name ' + new Date().getTime();

    const expectedText = [
      '/wordpress/wp-admin/',
      'blog',
      '202.136.75.194',
      '82.173.74.216',
      '187.131.21.37',
      'wp',
      '107.152.98.141',
      'login.php',
      '181.113.155.46',
      'admin',
      'wordpress',
      '/test/wp-admin/',
      'test',
      '/wp-login.php',
      '/blog/wp-admin/',
    ];

    // the line width with abotu 15 decimal places of accuracy looks like it will cause problems
    const expectedLineStyle = [
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:10px',
      'stroke-width:2.377140951428095px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
      'stroke-width:2px',
    ];

    it('should show correct data circle text', function() {
      // graph test https://github.com/elastic/examples/tree/master/ElasticStack_graph_apache
      return (
        PageObjects.graph
          .selectIndexPattern('secrepo')
          // select fields url.parts, url, params and src
          .then(() => {
            return PageObjects.graph.addField('url.parts');
          })
          .then(() => {
            return PageObjects.graph.addField('url');
          })
          .then(() => {
            return PageObjects.graph.addField('params');
          })
          .then(() => {
            return PageObjects.graph.addField('src');
          })
          .then(() => {
            return PageObjects.graph.query('wordpress');
          })
          .then(() => {
            return PageObjects.common.sleep(4000);
          })
          .then(() => {
            PageObjects.common.saveScreenshot('Graph');
          })
          .then(() => {
            return PageObjects.common.sleep(2000);
          })
          .then(() => {
            return PageObjects.graph.getGraphCircleText();
          })
          .then(circlesText => {
            log.debug('circle count = ' + circlesText.length);
            log.debug('circle values = ' + circlesText);
            expect(circlesText.length).to.equal(expectedText.length);
            expect(circlesText).to.contain('/wordpress/wp-admin/');
          })
      );
    });

    it('should show correct number of connecting lines', function() {
      return PageObjects.graph.getGraphConnectingLines().then(lineStyle => {
        log.debug('line count = ' + lineStyle.length);
        log.debug('line style = ' + lineStyle);
        expect(lineStyle.length).to.eql(expectedLineStyle.length);
        expect(lineStyle).to.contain('stroke-width:10px');
      });
    });

    it('should save Graph workspace', function() {
      return PageObjects.graph
        .saveGraph(graphName)
        .then(toastMessage => {
          log.debug('toastMessage = ' + toastMessage);
          expect(toastMessage).to.equal('Saved Workspace "' + graphName + '"');
        })
        .then(() => {
          PageObjects.visualize.waitForToastMessageGone();
        });
    });

    // open the same graph workspace again and make sure the results are the same
    it('should open Graph workspace', function() {
      return PageObjects.graph
        .openGraph(graphName)
        .then(() => {
          return PageObjects.common.sleep(4000);
        })
        .then(() => {
          return PageObjects.graph.getGraphCircleText();
        })
        .then(circlesText => {
          log.debug('circle count = ' + circlesText.length);
          log.debug('circle values = ' + circlesText);
          expect(circlesText.length).to.equal(15);
          expect(circlesText).to.contain('/wordpress/wp-admin/');
        });
    });

    it('should delete graph', function() {
      return PageObjects.graph.deleteGraph(graphName).then(alertText => {
        log.debug('alertText = ' + alertText);
      });
    });

    it('should show venn when clicking a line', function() {
      // We're clicking the one thickest line in this graph result that has a style="stroke-width:10px"
      // Sometimes the middle of the thickest line is behind another object, try loop around the whole test.
      return PageObjects.common.try(() => {
        return PageObjects.graph
          .newGraph()
          .then(() => {
            return PageObjects.graph.selectIndexPattern('secrepo');
          })
          .then(() => {
            // select fields url.parts, url, params and src
            return PageObjects.graph.addField('url.parts');
          })
          .then(() => {
            return PageObjects.graph.addField('url');
          })
          .then(() => {
            return PageObjects.graph.addField('params');
          })
          .then(() => {
            return PageObjects.graph.addField('src');
          })
          .then(() => {
            return PageObjects.graph.query('wordpress');
          })
          .then(() => {
            return PageObjects.common.sleep(2000);
          })
          .then(() => {
            log.debug('click the thickest line');
            return PageObjects.graph.clickGraphConnectingLine('stroke-width:10px');
          })
          .then(() => {
            return PageObjects.graph.getVennTerm1();
          })
          .then(vennTerm1 => {
            log.debug('vennTerm1 = ' + vennTerm1);
            expect(vennTerm1).to.be('/wordpress/wp-admin/');
          })
          .then(() => {
            return PageObjects.graph.getVennTerm2();
          })
          .then(vennTerm2 => {
            log.debug('vennTerm2 = ' + vennTerm2);
            expect(vennTerm2).to.be('wordpress');
          })
          .then(() => {
            return PageObjects.graph.getSmallVennTerm1();
          })
          .then(smallVennTerm1 => {
            log.debug('smallVennTerm1 = ' + smallVennTerm1);
            expect(smallVennTerm1).to.be('5');
          })
          .then(() => {
            return PageObjects.graph.getSmallVennTerm12();
          })
          .then(smallVennTerm12 => {
            log.debug('smallVennTerm12 = ' + smallVennTerm12);
            expect(smallVennTerm12).to.be(' (5) ');
          })
          .then(() => {
            return PageObjects.graph.getSmallVennTerm2();
          })
          .then(smallVennTerm2 => {
            log.debug('smallVennTerm2 = ' + smallVennTerm2);
            expect(smallVennTerm2).to.be('5');
          });
      });
    });

    it('should show correct number of connecting lines', function() {
      // the line width with abotu 15 decimal places of accuracy looks like it will cause problems
      return PageObjects.graph.getGraphConnectingLines().then(lineStyle => {
        log.debug('line count = ' + lineStyle.length);
        log.debug('line style = ' + lineStyle);
        expect(lineStyle).to.contain('stroke-width:10px');
      });
    });

    it('should save Graph workspace', function() {
      return PageObjects.graph
        .saveGraph(graphName)
        .then(toastMessage => {
          log.debug('toastMessage = ' + toastMessage);
          expect(toastMessage).to.equal('Saved Workspace "' + graphName + '"');
        })
        .then(() => {
          PageObjects.visualize.waitForToastMessageGone();
        });
    });

    // open the same graph workspace again and make sure the results are the same
    it('should open Graph workspace', function() {
      return PageObjects.graph
        .openGraph(graphName)
        .then(() => {
          return PageObjects.common.sleep(4000);
        })
        .then(() => {
          return PageObjects.graph.getGraphCircleText();
        })
        .then(circlesText => {
          log.debug('circle count = ' + circlesText.length);
          log.debug('circle values = ' + circlesText);
          expect(circlesText.length).to.equal(15);
          expect(circlesText).to.contain('/wordpress/wp-admin/');
        });
    });

    it('should delete graph', function() {
      return PageObjects.graph.deleteGraph(graphName).then(alertText => {
        log.debug('alertText = ' + alertText);
      });
    });

    it('should show venn when clicking a line', function() {
      // we're clicking the one thickest line in this graph result that has a style="stroke-width:10px"

      return PageObjects.common.try(() => {
        return (
          PageObjects.graph
            .newGraph()
            .then(() => {
              return PageObjects.graph.selectIndexPattern('secrepo');
            })
            .then(() => {
              // select fields url.parts, url, params and src
              return PageObjects.graph.addField('url.parts');
            })
            .then(() => {
              return PageObjects.graph.addField('url');
            })
            .then(() => {
              return PageObjects.graph.addField('params');
            })
            .then(() => {
              return PageObjects.graph.addField('src');
            })
            // .then(() => {
            //   return PageObjects.common.sleep(2000);
            // })
            .then(() => {
              return PageObjects.graph.query('wordpress');
            })
            .then(() => {
              return PageObjects.common.sleep(2000);
            })
            .then(() => {
              // return PageObjects.common.tryForTime(3000, () => {
              log.debug('click the thickest line');
              return PageObjects.graph.clickGraphConnectingLine('stroke-width:10px');
              // });
            })
            .then(() => {
              return PageObjects.graph.getVennTerm1();
            })
            .then(vennTerm1 => {
              log.debug('vennTerm1 = ' + vennTerm1);
              expect(vennTerm1).to.be('/wordpress/wp-admin/');
            })
            .then(() => {
              return PageObjects.graph.getVennTerm2();
            })
            .then(vennTerm2 => {
              log.debug('vennTerm2 = ' + vennTerm2);
              expect(vennTerm2).to.be('wordpress');
            })
            .then(() => {
              return PageObjects.graph.getSmallVennTerm1();
            })
            .then(smallVennTerm1 => {
              log.debug('smallVennTerm1 = ' + smallVennTerm1);
              expect(smallVennTerm1).to.be('5');
            })
            .then(() => {
              return PageObjects.graph.getSmallVennTerm12();
            })
            .then(smallVennTerm12 => {
              log.debug('smallVennTerm12 = ' + smallVennTerm12);
              expect(smallVennTerm12).to.be(' (5) ');
            })
            .then(() => {
              return PageObjects.graph.getSmallVennTerm2();
            })
            .then(smallVennTerm2 => {
              log.debug('smallVennTerm2 = ' + smallVennTerm2);
              expect(smallVennTerm2).to.be('5');
            })
        );
      });
    });
  });
};
