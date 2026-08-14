import mysql from 'mysql2/promise'

export const pool = mysql.createPool({

host: process.env.DB_HOST || 'localhost',
user: process.env.DB_USER || 'dsw',
password: process.env.DB_PASSWORD || 'dsw',
port: process.env.DB_PORT ? parseInt(process.env.DB_PORT): 3308,
database: process.env.DB_NAME || 'event_management',

waitForConnections: true,
connectionLimit: 10,
maxIdle: 10,
idleTimeout: 60000,
queueLimit: 0,
enableKeepAlive: true,
keepAliveInitialDelay: 0,

})