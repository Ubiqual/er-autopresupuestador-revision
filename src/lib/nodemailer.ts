import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.servidor-correo.net',
  port: 587,
  secure: false,
  auth: {
    user: 'presupuestos@estebanrivas.info',
    pass: 'Fernando2024'
  },
  tls: {
    rejectUnauthorized: false
  }
});

export default transporter;
