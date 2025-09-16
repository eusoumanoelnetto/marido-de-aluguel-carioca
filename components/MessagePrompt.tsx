import React, { useState } from 'react';

interface Props {
  open: boolean;
  title?: string;
  placeholder?: string;
  initial?: string;
  onCancel: () => void;
  onConfirm: (message: string | undefined) => void;
}

const MessagePrompt: React.FC<Props> = ({ open, title = 'Mensagem para o prestador', placeholder = 'Escreva uma mensagem (opcional)...', initial = '', onCancel, onConfirm }) => {
  const [value, setValue] = useState(initial);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-5">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="w-full p-3 border rounded-md h-28" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => { setValue(''); onCancel(); }} className="px-4 py-2 border rounded-md">Cancelar</button>
          <button onClick={() => onConfirm(value?.trim() ? value.trim() : undefined)} className="px-4 py-2 bg-brand-blue text-white rounded-md">Enviar</button>
        </div>
      </div>
    </div>
  );
};

export default MessagePrompt;
