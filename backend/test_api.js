const { getBusinessAnalysisReport } = require('./src/controllers/reportController');
const { User, Role, Office } = require('./src/models');

async function test() {
    try {
        // Mock User
        const user = await User.findOne({
            include: [{ model: Role }]
        });
        
        if (!user) {
            console.error('No user found to mock request');
            process.exit(1);
        }

        const req = {
            query: { officeId: '', year: '2026' },
            user: user
        };
        
        const res = {
            status: function(code) {
                console.log('Status:', code);
                return this;
            },
            json: function(data) {
                console.log('Response JSON:', JSON.stringify(data, null, 2));
            }
        };

        console.log('Running getBusinessAnalysisReport...');
        await getBusinessAnalysisReport(req, res);
        process.exit(0);
    } catch (err) {
        console.error('CRASH:', err);
        process.exit(1);
    }
}

test();
