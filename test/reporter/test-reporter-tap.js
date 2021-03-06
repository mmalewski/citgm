// TODO this test does not test any functionality currently
'use strict';

const fs = require('fs');
const { mkdir } = fs.promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');

const { test } = require('tap');
const rimraf = promisify(require('rimraf'));
const Parser = require('tap-parser');
const str = require('string-to-stream');

const tap = require('../../lib/reporter/tap');
const fixtures = require('../fixtures/reporter-fixtures');

const fixturesPath = path.join(__dirname, '..', 'fixtures');
const sandbox = path.join(os.tmpdir(), `citgm-${Date.now()}`);
const outputFile = path.join(sandbox, 'test.tap');
const outputFileAppend = path.join(sandbox, 'test-append.tap');
const outputFileAppendBlank = path.join(sandbox, 'test-append-blank.tap');

const appendStartFilePath = path.join(fixturesPath, 'appendTestFileStart.txt');

const passingInput = [fixtures.iPass, fixtures.iFlakyPass];

const passingExpectedPath = path.join(fixturesPath, 'test-out-tap-passing.txt');
const passingExpectedPathAppend = path.join(
  fixturesPath,
  'test-out-tap-passing-append.txt'
);

const tapParserExpected = require('../fixtures/parsed-tap.json');
const passingExpected = fs.readFileSync(passingExpectedPath, 'utf-8');
const passingExpectedAppend = fs.readFileSync(
  passingExpectedPathAppend,
  'utf-8'
);

const failingInput = [fixtures.iPass, fixtures.iFlakyFail, fixtures.iFail];

const failingExpectedPath = path.join(fixturesPath, 'test-out-tap-failing.txt');
const failingExpected = fs.readFileSync(failingExpectedPath, 'utf-8');

test('reporter.tap(): setup', async () => {
  await mkdir(sandbox, { recursive: true });
});

test('reporter.tap(): passing', (t) => {
  t.plan(1);
  let output = '';
  function logger(message) {
    output += message;
    output += '\n';
  }

  tap(logger, passingInput);
  t.equals(
    output,
    passingExpected,
    'we should get expected output when all' + ' modules pass'
  );
  t.end();
});

test('reporter.tap(): failing', (t) => {
  t.plan(1);
  let output = '';
  function logger(message) {
    output += message;
    output += '\n';
  }

  tap(logger, failingInput);
  t.equals(output, failingExpected),
    'we should get the expected output when a' + ' module fails';
  t.end();
});

test('reporter.tap(): parser', (t) => {
  t.plan(1);
  let output = '';
  function logger(message) {
    output += message;
  }

  tap(logger, failingInput);
  const p = new Parser((results) => {
    t.deepEquals(results, tapParserExpected),
      'the tap parser should correctly' + ' parse the tap file';
    t.end();
  });
  str(output).pipe(p);
});

test('reporter.tap(): write to disk', (t) => {
  t.plan(1);
  tap(outputFile, passingInput);
  const expected = fs.readFileSync(outputFile, 'utf8');
  t.equals(expected, passingExpected),
    'the file on disk should match the' + ' expected output';
  t.end();
});

test('reporter.tap(): append to disk', (t) => {
  t.plan(1);
  const appendStartFile = fs.readFileSync(appendStartFilePath, 'utf-8');
  fs.writeFileSync(outputFileAppend, appendStartFile);
  tap(outputFileAppend, passingInput, true);
  const expected = fs.readFileSync(outputFileAppend, 'utf8');
  t.equals(expected, passingExpectedAppend),
    'the file on disk should match the' + ' expected output';
  t.end();
});

test('reporter.tap(): append to disk when file does not exist', (t) => {
  t.plan(1);
  tap(outputFileAppendBlank, passingInput, true);
  const expected = fs.readFileSync(outputFileAppendBlank, 'utf8');
  t.equals(expected, passingExpected),
    'the file on disk should match the' + ' expected output';
  t.end();
});

test('reporter.tap(): teardown', async () => {
  await rimraf(sandbox);
});
