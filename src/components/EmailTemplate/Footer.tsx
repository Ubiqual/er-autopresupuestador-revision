import React from 'react';
import { BASE_URL } from '../../utils/constants';

const Footer: React.FC = () => {
  return (
    <table width="100%" border={0} cellSpacing={0} cellPadding={0} style={{ textAlign: 'center' }}>
      <tbody>
        <tr>
          <td align="center">
            <div
              style={{
                width: '320px',
                borderTop: '4px solid #3B4DA0',
                margin: '30px 0'
              }}
            />
          </td>
        </tr>
        <tr>
          <td>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 'bold',
                margin: '10px 0 5px 0'
              }}
            >
              ¡muchas gracias por elegirnos!
            </h3>
            <p
              style={{
                fontSize: '15px',
                margin: 0
              }}
            >
              Equipo de Esteban Rivas
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <img
              src={`${BASE_URL}/email-assets/bus.png`}
              alt="Footer Image"
              style={{
                display: 'block',
                width: '100%',
                maxHeight: '205px',
                marginTop: '30px'
              }}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default Footer;
