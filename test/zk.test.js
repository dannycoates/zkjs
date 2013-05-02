/*!
 * zkjs - test/zk.test.js
 */

"use strict";

/**
 * Module dependencies.
 */

var pedding = require('pedding');
var should = require('should');
var ZK = require('../');

describe('zk.test.js', function () {

  var zk = ZK({
    hosts: ['api.yongwo.de:2181'],
    root: '/zkjs-unitttest'
  });

  before(function (done) {
    zk.start(done);
  });
  after(function (done) {
    zk.close(done);
  });
  
  describe('create()', function () {

    var pathname = '/test-create';

    beforeEach(function (done) {
      zk.exists(pathname, function (errno, data, zstat) {
        if (!zstat) {
          return done();
        }
        zk.del(pathname, zstat.version, function (errno) {
          done(errno ? errno : null);
        });
      });
    });
    
    it('should create path with data', function (done) {
      zk.create(pathname, 'test create path data', function (errno, path) {
        should.not.exists(errno);
        path.should.equal(pathname);
        zk.get(pathname, function (errno, data, zstat) {
          should.not.exists(errno);
          data.toString().should.equal('test create path data');
          zstat.should.have.property('version', 0);
          done();
        });
      });
    });

    it('should create exists path return errno: -110', function (done) {
      zk.create(pathname, 'test create path data', function (errno, path) {
        should.not.exists(errno);
        path.should.equal(pathname);
        zk.create(pathname, 'test create path data', function (errno, path) {
          should.exists(errno);
          errno.should.equal(-110);
          should.not.exists(path);
          done();
        });
      });
    });

  });

  describe('get()', function () {

    var pathname = '/test-get';

    beforeEach(function (done) {
      zk.exists(pathname, function (errno, exists, zstat) {
        if (exists) {
          return done();
        }
        zk.create(pathname, 'test get() path data', function (errno, path) {
          done(errno ? errno : null);
        });
      });
    });
    
    it('should get exists path data', function (done) {
      zk.get(pathname, function (errno, data, zstat) {
        should.not.exists(errno);
        data.toString().should.include('test get() path data');
        zstat.should.have.property('version').with.be.a('number');
        done();
      });
    });

    it('should get not exists path data return errno: -101', function (done) {
      zk.get(pathname + '-not-exists', function (errno, data, zstat) {
        should.exists(errno);
        errno.should.equal(-101);
        should.not.exists(data);
        should.not.exists(zstat);
        done();
      });
    });

    it('should get exists path data and watch it changed', function (done) {
      done = pedding(2, done);

      zk.get(pathname, function (info) {
        info.should.eql({
          type: 'changed', 
          state: 'connected', 
          path: '/test-get'
        });
        zk.get(pathname, function (errno, data) {
          should.not.exists(errno);
          data.toString().should.include('changed at');
          done();
        });
      }, function (errno, data, zstat) {
        should.not.exists(errno);
        data.toString().should.include('test get() path data');
        zstat.should.have.property('version').with.be.a('number');

        // change it
        zk.set(pathname, 'test get() path data changed at ' + new Date(), zstat.version, done);
      });
    });

  });

  describe('sync()', function () {
    it('should sync the node with leader', function (done) {
      zk.sync('/', function (errno, path) {
        should.not.exists(errno);
        path.should.equal('/');
        done();
      });
    });

    it('should sync not exists node', function (done) {
      zk.sync('/not-exists', function (errno, path) {
        should.not.exists(errno);
        path.should.equal('/not-exists');
        done();
      });
    });
  });

  describe('getChildren()', function () {
    it('should return / node children', function (done) {
      zk.getChildren('/', function (errno, children, zstat) {
        should.not.exists(errno);
        should.exists(children);
        children.should.be.instanceof(Array);
        children.length.should.above(0);
        children.should.include('test-get');
        should.exists(zstat);
        done();
      });
    });

    it('should get not exists node children return errno: -101', function (done) {
      zk.getChildren('/not-exists', function (errno, children, zstat) {
        should.exists(errno);
        errno.should.equal(-101);
        should.not.exists(children);
        should.not.exists(zstat);
        done();
      });
    });
  });

  describe("on('expired')", function () {
    it('should restart after "expired"', function (done) {
      zk.once('expired', function () {
        zk.start(function (errno) {
          should.not.exists(errno);

          zk.get('/', function (errno, data, zstat) {
            should.not.exists(errno);
            should.exists(data);
            done();
          });

        });
      });
      zk.ensemble.emit('expired');
    });
  });

});