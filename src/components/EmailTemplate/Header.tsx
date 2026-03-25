import { EmailType } from '@/types/Emails';
import React from 'react';
import { BASE_URL } from '../../utils/constants';

interface HeaderProps {
  type: EmailType;
}

const Header: React.FC<HeaderProps> = ({ type }) => {
  let title = '';
  let description = '';
  let message = '';

  const showButton = type === EmailType.SAVED;

  switch (type) {
    case EmailType.SAVED:
      title = '¡muchas gracias!';
      description = 'Te adjuntamos un resumen de tu presupuesto.';
      message =
        'No olvides solicitar la reserva del servicio. En ese caso, estudiaremos nuestra disponibilidad y confirmaremos tu reserva.';
      break;

    case EmailType.REQUESTED:
      title = '¡nos ponemos en marcha!';
      description = 'Hemos recibido tu solicitud de reserva correctamente.';
      message = 'Estudiaremos nuestra disponibilidad y confirmaremos tu reserva.';
      break;

    case EmailType.ACCEPTED:
      title = '¡reserva confirmada!';
      description = 'Nuestros agentes han confirmado tu solicitud, ¡estaremos encantados de recibirte a bordo!';
      message = 'resumen de tu reserva';
      break;

    case EmailType.DECLINED:
      title = 'lo sentimos';
      description = 'No tenemos disponibilidad para la siguiente solicitud de reserva';
      break;
  }

  return (
    <table
      width="600"
      align="center"
      border={0}
      cellSpacing={0}
      cellPadding={0}
      style={{ margin: '0 auto', fontFamily: 'Verdana, sans-serif' }}
    >
      <tbody>
        <tr>
          <td align="center">
            <img
              src={`${BASE_URL}/email-assets/logo.png`}
              alt="Esteban Rivas"
              style={{ display: 'block', margin: '0 auto', maxWidth: '200px' }}
            />
          </td>
        </tr>

        <tr>
          <td align="center">
            <h2
              style={{
                color: '#4554A1',
                fontSize: '50px',
                marginTop: '20px',
                marginBottom: '10px',
                fontWeight: 'normal',
                maxWidth: '550px',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {title}
            </h2>
          </td>
        </tr>

        <tr>
          <td align="center">
            <p
              style={{
                fontSize: '20px',
                color: '#4554A1',
                margin: '0 0 20px',
                textAlign: 'center'
              }}
            >
              {description}
            </p>
          </td>
        </tr>

        <tr>
          <td align="center">
            <table
              width="650"
              align="center"
              border={0}
              cellSpacing={0}
              cellPadding={0}
              style={{ margin: '20px auto' }}
            >
              <tbody>
                <tr>
                  <td align="center">
                    <p
                      style={{
                        display: 'inline-block',
                        verticalAlign: 'middle',
                        fontSize: type === EmailType.ACCEPTED ? '20px' : '15px',
                        color: type === EmailType.ACCEPTED ? '#4554A1' : '#000000CC',
                        margin: 0,
                        maxWidth: '100%',
                        textAlign: 'center'
                      }}
                    >
                      {message}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        {showButton && (
          <tr>
            <td align="center">
              <a
                href={BASE_URL}
                style={{
                  display: 'inline-block',
                  textDecoration: 'none',
                  backgroundColor: '#3B4DA0',
                  color: '#ffffff',
                  fontSize: '15px',
                  borderRadius: '9999px',
                  padding: '12px 24px',
                  marginTop: '20px'
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    lineHeight: '20px'
                  }}
                >
                  quiero reservar ahora
                </span>
                <img
                  src={`${BASE_URL}/email-assets/whiteArrow.png`}
                  alt=""
                  width={24}
                  height={17.5}
                  style={{
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    marginLeft: '30px'
                  }}
                />
              </a>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default Header;
