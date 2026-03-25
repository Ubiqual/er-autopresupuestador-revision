import React from 'react';
import { BASE_URL } from '../../utils/constants';

const DeclinedMessageBox: React.FC = () => {
  return (
    <table
      width="100%"
      border={0}
      cellSpacing={0}
      cellPadding={0}
      style={{
        margin: '20px auto',
        maxWidth: '600px',
        backgroundColor: '#F5F5F5',
        borderRadius: '42px',
        padding: '40px',
        fontFamily: 'Verdana, sans-serif',
        color: '#111111'
      }}
    >
      <tbody>
        <tr>
          <td
            style={{
              width: '60px',
              verticalAlign: 'top'
            }}
          >
            <img
              src={`${BASE_URL}/email-assets/question_mark.png`}
              alt="Question Icon"
              style={{
                display: 'block',
                width: '42px',
                height: '48px'
              }}
            />
          </td>

          <td
            style={{
              verticalAlign: 'top',
              paddingLeft: '15px'
            }}
          >
            <h3
              style={{
                margin: '0 0 10px 0',
                fontSize: '16px',
                color: '#000000CC'
              }}
            >
              ¿Qué puedo hacer ahora?
            </h3>

            <p
              style={{
                margin: 0,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#000000CC'
              }}
            >
              No tenemos disponibilidad en la fecha solicitada, puedes probar otra fecha{' '}
              <a href={BASE_URL} style={{ textDecoration: 'underline', color: '#000000CC' }}>
                aquí
              </a>
              .
            </p>

            <p
              style={{
                margin: '10px 0 0 0',
                fontSize: '14px',
                lineHeight: '20px',
                color: '#000000CC'
              }}
            >
              Asimismo, no dudes en{' '}
              <a href="https://estebanrivas.es/contacto/" style={{ textDecoration: 'underline', color: '#000000CC' }}>
                contactar
              </a>{' '}
              con nosotros si necesitas asistencia personalizada.
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default DeclinedMessageBox;
