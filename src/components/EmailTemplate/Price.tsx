import type { EmailType } from '@/types/Emails';
import { formatPrice } from '@/utils/formatPrice';
import { t } from '@/utils/i18n';
import React from 'react';

interface PriceProps {
  totalPrice: number;
  type: EmailType;
  vatAmount?: string;
  serviceType: string;
}

const Price: React.FC<PriceProps> = ({ totalPrice, vatAmount, serviceType }) => {
  const luxPrice = formatPrice(totalPrice * 0.2);

  return (
    <table width="650" border={0} cellSpacing={0} cellPadding={0} style={{ marginTop: '60px', textAlign: 'center' }}>
      <tbody>
        <tr>
          <td align="center" width="650" style={{ textAlign: 'center' }}>
            <h2
              style={{
                color: '#4554A1',
                fontSize: '30px',
                fontWeight: 'bold',
                marginTop: '0',
                marginBottom: '10px',
                textAlign: 'center', // Ensure the price is centered
                display: 'inline-block' // Add inline-block to center within the table cell
              }}
            >
              {t('results.totalPrice', { price: formatPrice(totalPrice) })}
              <sup>*</sup>
            </h2>
          </td>
        </tr>
        <tr>
          <td align="center" style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '1rem',
                color: '#4b5563',
                marginTop: '0.1rem',
                marginBottom: '0',
                textAlign: 'center'
              }}
            >
              {t('bookingPage.vat', { vat: vatAmount })}
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style={{ textAlign: 'center' }}>
            {serviceType.toLocaleLowerCase() !== 'bodas' && (
              <p
                style={{
                  fontSize: '1rem',
                  color: '#4b5563',
                  marginTop: '0.5rem',
                  marginBottom: '2.5rem'
                }}
              >
                {t('bookingPage.luxPromo', { price: luxPrice })}
                <b>Esteban Rivas Gran Lujo</b>
              </p>
            )}
          </td>
        </tr>
        <tr>
          <td align="center" style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '1rem',
                color: '#4b5563',
                marginTop: '2.5rem',
                textAlign: 'center'
              }}
            >
              {t('bookingPage.noTollsIncluded')}
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: '1rem',
                color: '#4b5563',
                marginTop: '0.5rem',
                marginBottom: '2.5rem',
                textAlign: 'center'
              }}
            >
              *Tasa de entrada a ciudades no incluida
            </p>
          </td>
        </tr>
        {/* {type === EmailType.ACCEPTED && (
          <tr>
            <td style={{ width: '100%', textAlign: 'center' }}>
              <a
                href="https://estebanrivas.es/pasarela-pago/"
                style={{
                  display: 'inline-block',
                  textDecoration: 'none',
                  backgroundColor: '#3B4DA0',
                  color: '#ffffff',
                  fontSize: '15px',
                  borderRadius: '9999px',
                  padding: '12px 24px',
                  marginTop: '40px'
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    lineHeight: '20px',
                    fontFamily: 'Verdana, sans-serif'
                  }}
                >
                  pagar reserva
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
        )} */}
      </tbody>
    </table>
  );
};

export default Price;
