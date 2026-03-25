import CheckList from '@/assets/icons/check-list.svg';
import Email from '@/assets/icons/email-blue.svg';
import Headphones from '@/assets/icons/headphones.svg';

export function NeedHelp() {
  return (
    <div id="need-help-section" className="container p-4 mb-20 gap-8 xl:gap-16 flex flex-col items-center mx-auto">
      <div className="flex flex-col items-center gap-4 xl:gap-8">
        <span className="text-[#4554A1] text-2xl xl:text-5xl">¿necesitas ayuda?</span>
        <p className="text-center text-[#83776F] max-w-[750px]">
          ¿No has encontrado lo que buscabas? Si el resultado no se ajusta a tus planes, no te preocupes, nuestro equipo
          estará encantado de ayudarte. Contacta con nosotros:
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-8">
        <div className="grid grid-cols-10 bg-[#F5F5F5] rounded-xl py-6 h-[144px]">
          <div className="col-span-2 flex flex-col justify-center items-center">
            <Headphones />
          </div>
          <div className="col-span-8 flex flex-col items-start justify-center gap-4 text-[#737373] text-sm pr-4">
            <a
              href="tel:+34916937711"
              target="_blank"
              rel="noopener noreferrer"
              id="presupuestador_contacto_telefono"
              className="text-base font-bold"
            >
              916 937 711
            </a>
            <span>Atención comercial: L-D de 9-18 h</span>
            <span>Atención al cliente: 24 horas/365 días</span>
          </div>
        </div>
        <div className="grid grid-cols-10 bg-[#3B4DA0] rounded-xl py-6 h-[144px]">
          <div className="col-span-2 flex flex-col justify-center items-center">
            <CheckList />
          </div>
          <div className="col-span-8 flex flex-col items-start justify-center gap-4 text-white text-sm pr-4">
            <span className="font-bold">Presupuesto a medida.</span>
            <span>
              <a
                className="underline"
                href="https://estebanrivas.es/autopresupuestador-formulario-autocares-esteban-rivas/"
                target="_blank"
                rel="noopener noreferrer"
                id="presupuestador_formulario_tradicional"
              >
                Haz clic aquí
              </a>
              &nbsp;y cuéntanos los detalles de tu viaje. Un agente preparará el presupuesto.
            </span>
          </div>
        </div>
        <div className="grid grid-cols-10 bg-[#F5F5F5] rounded-xl py-6 h-[144px]">
          <div className="col-span-2 flex flex-col justify-center items-center">
            <Email />
          </div>
          <div className="col-span-8 flex flex-col items-start justify-center gap-4 text-[#737373] text-sm pr-4">
            <a
              href="mailto:info@estebanrivas.es"
              target="_blank"
              rel="noopener noreferrer"
              id="presupuestador_contacto_email"
            >
              info@estebanrivas.es
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
