const express = require('express');
const app = express();
const getConnection=require('./db.js');
let connection

async function connectToDb(){
    try {
    const connection = await getConnection();      
    return connection;
    } catch (error) {
        
    }
}
app.use(express.json());

app.use('/guests', require('./routes/guests.js'));
app.use('/matches', require('./routes/matches.js'));
app.use('/admin', require('./routes/admin.js'));
app.use('/stadium', require('./routes/stadium.js'));

app.listen(3000, async() => {
connection=await connectToDb();
  console.log('Server running on http://localhost:3000');
});

module.exports=connection;