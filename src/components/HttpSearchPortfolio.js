/**
 * 
 * A HTTP GET request that will take a search parameter and perform a sql search for it from the Azure SQL database.
 * Should return the requested user portfolio, status
 * code and a success or fail message.
 * 
 */


const { app } = require('@azure/functions');
const sql = require('mssql');
const http = require('http');
const url = require('url'); // Node.js built-in url module
require('dotenv').config() // or import 'dotenv/config' if you're using ES6

console.log('Process.env: ' + process.env) // remove this after you've confirmed it is working

//Use Azure VM Managed Identity to connect to the SQL database
const config = {
    server: process.env["db_server"],
    port: process.env["db_port"],
    database: process.env["db_database"],
    authentication: {
        type: 'azure-active-directory-msi-vm'
    },
    options: {
        encrypt: true
    }
}

app.http('httpTriggerSearchPortfolio', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const parsedUrl = new URL(request.url, `http://${request.headers.host}`); // Create a URL object
        const searchSummary = parsedUrl.searchParams.get('summary');

        if (searchSummary) {
            context.log("search parameter received: " + searchSummary);

        }
        else {
            return {
                status: 400,
                body: "Please pass a summary on the query string or in the request body"
            };
        }

        try {
            var poolConnection = await sql.connect(config);

            console.log("Reading rows from the Table...");
            var resultSet = await poolConnection.request().query(`SELECT profile_id, user_id, headline, summary, professional_field
                                                                        FROM '${process.env["db_database"]}'.profiles
                                                                        WHERE summary LIKE '%${searchSummary}%';`);

            console.log(`${resultSet.recordset.length} rows returned.`);

            // output column headers
            var columns = "";
            for (var column in resultSet.recordset.columns) {
                columns += column + ", ";
            }
            console.log("%s\t", columns.substring(0, columns.length - 2));

            // output row contents from default record set
            resultSet.recordset.forEach(row => {
                console.log("%s\t%s", row.CategoryName, row.ProductName);
            });

            // close connection only when we're certain application is finished
            poolConnection.close();

            return {
                status: 200, // Defaults to 200 
                body: "Portfolio search results : " + JSON.stringify(resultSet.recordset) // resultSet.recordset contains the rows returned by the query
            };
        } catch (err) {
            console.error(err.message);
        }
    }
});
