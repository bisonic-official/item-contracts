module.exports = {
    apps: [{
        name: 'signer',
        script: 'uvicorn app:app --host 0.0.0.0'
    }]
};
