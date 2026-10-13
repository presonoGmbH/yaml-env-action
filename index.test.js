const core = require('@actions/core');
const index = require('./index');

describe("Split Files Tests", () => {

    test('Two files in string should return array of two', async () => {
        const files = 'file1.yml file2.yml';
        const result = await index.splitFiles(files);
        expect(result).toEqual(['file1.yml', 'file2.yml']);
    })

    test('One file in string should return array of one', async () => {
        const files = 'file1.yml';
        const result = await index.splitFiles(files);
        expect(result).toEqual(['file1.yml']);
    })

    test('Empty string should return empty array', async () => {
        const files = '';
        const result = await index.splitFiles(files);
        expect(result).toEqual([]);
    })

    test('Null should return empty array', async () => {
        const files = null;
        const result = await index.splitFiles(files);
        expect(result).toEqual([]);
    })

    test('Undefined should return empty array', async () => {
        const files = undefined;
        const result = await index.splitFiles(files);
        expect(result).toEqual([]);
    })

})

describe('Test Get Environment', () => {

    test('Single dict should be flattened and title cased', async () => {
        const result = await index.getEnvironment(
            [
                {
                    'test': 'test'
                }
            ]
        );
        expect(result).toEqual({
            'TEST': 'test'
        });
    })

    test('Two dicts should be flattened and title cased with the second dict overriding', async () => {
        const result = await index.getEnvironment(
            [
                {
                    'test': 'test'
                },
                {
                    'test': 'test2'
                }
            ]
        );
        expect(result).toEqual({
            'TEST': 'test2',
        });
    })

    test('Complex case multiple dicts with override and extra values', async () => {
        const result = await index.getEnvironment(
            [
                {
                    'test': 'test',
                    'testTwo': 'test2'
                },
                {
                    'test': 'test2',
                    'testThree': 'test3'
                },
                {
                    'testFour': 'test4',
                }
            ]
        );
        expect(result).toEqual({
            'TEST': 'test2',
            'TEST_TWO': 'test2',
            'TEST_THREE': 'test3',
            "TEST_FOUR": "test4"
        });
    })

    test('Hyphen should work become constant-case', async () => {
        const result = await index.getEnvironment(
            [
                {
                    'test-test': 'test'
                }
            ]
        );
        expect(result).toEqual({
            'TEST_TEST': 'test'
        });
    })

    test('Nested objects should merge properly', async () => {
        const result = await index.getEnvironment(
            [
                {
                    "name": "application",
                    "terraform": {
                        "bucket": "f46cc6e2-86e3-428d-b266-612d7913ef2d"
                    }
                },
                {
                    "webService": {
                        "dns": "my-d.webservice.com"
                    },
                    "apiService": {
                        "dns": "my-d.apiservice.com"
                    },
                    "name": "application-dev",
                }
            ]
        );
        expect(result).toEqual({
            "NAME": "application-dev",
            "TERRAFORM_BUCKET": "f46cc6e2-86e3-428d-b266-612d7913ef2d",
            "WEB_SERVICE_DNS": "my-d.webservice.com",
            "API_SERVICE_DNS": "my-d.apiservice.com"
        });
    })

    test('Underscore should work become constant-case', async () => {
        const result = await index.getEnvironment(
            [
                {
                    'test_test': 'test'
                }
            ]
        );
        expect(result).toEqual({
            'TEST_TEST': 'test'
        });
    })

    test('Empty object should return empty object', async () => {
        const result = await index.getEnvironment(
            [
                {}
            ]
        );
        expect(result).toEqual({});
    })



})

describe('Mask Value Tests', () => {

    let setSecret;

    beforeEach(() => {
        setSecret = jest.spyOn(core, 'setSecret').mockImplementation(() => {});
    })

    afterEach(() => {
        setSecret.mockRestore();
    })

    test('Single line value should be masked as a whole', () => {
        index.maskValue('s3cr3t value');
        expect(setSecret.mock.calls).toEqual([['s3cr3t value']]);
    })

    test('Every line of a multi-line value should be masked on its own', () => {
        index.maskValue('-----BEGIN KEY-----\nline1\r\nline2\n\n   \n-----END KEY-----\n');
        expect(setSecret.mock.calls).toEqual([['-----BEGIN KEY-----'], ['line1'], ['line2'], ['-----END KEY-----']]);
    })

    test('Numbers and booleans should be masked as they are exported', () => {
        index.maskValue(1234);
        index.maskValue(false);
        expect(setSecret.mock.calls).toEqual([['1234'], ['false']]);
    })

    test('Empty values should not be masked', () => {
        index.maskValue('');
        index.maskValue('  ');
        index.maskValue(null);
        index.maskValue(undefined);
        expect(setSecret).not.toHaveBeenCalled();
    })

})