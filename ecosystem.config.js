module.exports = {
    apps: [{
        name: 'signer',
        cmd: 'uvicorn app:app --host 0.0.0.0',
        interpreter: 'bash'
    }]
};
