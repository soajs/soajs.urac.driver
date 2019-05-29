"use strict";

const shell = require('shelljs');
let sampleData = require("../data/index");

describe("Starting Gateway Unit test", () => {
    it("Init unit test", (done) => {
        done();
    });
    it("Unit Test - import data", (done) => {
        shell.pushd(sampleData.dir);
        shell.exec("chmod +x " + sampleData.shell, (code) => {
            assert.equal(code, 0);
            shell.exec(sampleData.shell, (code) => {
                assert.equal(code, 0);
                shell.popd();
                done();
            });
        });
    });
    after((done) => {

        require("./model/mongo/group.js");

        done();
    });
});