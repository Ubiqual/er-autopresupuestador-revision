'use client';

import Email from '@/assets/icons/email.svg';
import Location from '@/assets/icons/location-outline.svg';
import Telephone from '@/assets/icons/telephone.svg';
import WhiteLogo from '@/assets/images/logo_white.png';
import { t } from '@/utils/i18n';
import { format } from 'date-fns'; // Import date-fns library
import Image from 'next/image';
import React from 'react';

export default function Footer() {
  const currentYear = format(new Date(), 'yyyy'); // Get the current year

  return (
    <footer className="bg-[#4554A1] text-white pt-0  pb-6">
      <div className="max-w-full lg:max-w-[72vw] mx-auto px-6 lg:px-0 lg:px-4 mt-8 lg:mt-20">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row justify-between gap-8">
          {/* Left Column: Logo & Address */}

          <div className="relative w-[132px] lg:w-[283px] h-[57px] lg:h-[122px] mb-8">
            <Image src={WhiteLogo} alt={t('footer.logoAlt')} fill className="object-contain no-repeat" sizes="283px" />
          </div>
          <div>
            <div className="flex">
              <Location width={20} height={20} style={{ currentColor: 'white' }} className="mr-2" />
              <p className="text-sm leading-relaxed">
                {t('footer.address.line1')}
                <br />
                {t('footer.address.line2')}
                <br />
                {t('footer.address.line3')}
              </p>
            </div>
            <div className="flex mt-4 items-start">
              <Telephone width={20} height={20} style={{ currentColor: 'white' }} className="mr-2" />
              <p className="text-sm leading-relaxed">
                <a
                  href="tel:+34916937711"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="presupuestador_contacto_telefono"
                  className="font-bold"
                >
                  {t('footer.phone.number')}
                </a>
                <br />
                {t('footer.phone.commercial')}
                <br />
                {t('footer.phone.customerService')}
              </p>
            </div>

            <div className="flex mt-4 items-start items-center">
              <Email width={20} height={20} style={{ currentColor: 'white' }} className="mr-2" />
              <a
                href="mailto:info@estebanrivas.es"
                target="_blank"
                rel="noopener noreferrer"
                id="presupuestador_contacto_email"
                className="text-sm font-bold"
              >
                {t('footer.email')}
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Section */}
      <div className="mt-8 border-t border-white/30 pt-6 items-center flex flex-col justify-center">
        <p className="text-xs mb-6 w-[263px] lg:w-full text-center">
          © 1955-{currentYear} {t('footer.rightsReserved')}
        </p>
        <div className="text-xs w-[353px] lg:w-full text-center">
          <div className="flex flex-col lg:flex-row lg:justify-center lg:items-center lg:space-x-2">
            <div className="flex justify-center space-x-2">
              <a href={t('footer.policies.legalNotice.link')} className="hover:underline">
                {t('footer.policies.legalNotice.text')}
              </a>
              <span>|</span>
              <a href={t('footer.policies.cookiePolicy.link')} className="hover:underline">
                {t('footer.policies.cookiePolicy.text')}
              </a>
            </div>
            <div className="flex justify-center space-x-2 mt-1 lg:mt-0">
              <a href={t('footer.policies.qualityPolicy.link')} className="hover:underline">
                {t('footer.policies.qualityPolicy.text')}
              </a>
              <span>|</span>
              <a href={t('footer.policies.ethicalChannel.link')} className="hover:underline">
                {t('footer.policies.ethicalChannel.text')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
