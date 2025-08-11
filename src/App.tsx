import { useRef, useEffect, useState, forwardRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { Search, ArrowUpDown, CornerDownLeft, Clock as ClockIcon } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import "./App.css";

const Clock = () => {
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      // Formata a data para "DD Mês" (ex: 11 Ago) em português
      const day = now.getDate();
      const month = now.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');

      setDateTime(`${hours}:${minutes}:${seconds} | ${day} ${month}`);
    };

    updateClock();
    const timerId = setInterval(updateClock, 60);

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-green-900/40 border border-green-500/40 rounded-lg px-3 py-1.5 text-sm text-green-300 font-medium whitespace-nowrap">
      <ClockIcon size={16} className="text-green-400" />
      <span>{dateTime}</span>
    </div>
  );
};

// Componente de atalho do teclado
const KeyShortcut = ({ children }) => (
  <div className="bg-gray-700/80 border border-gray-600/90 rounded-md px-2 py-0.5 text-xs font-mono text-gray-300">
    {children}
  </div>
);



const Command = () => {

  const widgets = {
      total_space: "call_total_space",
      available_space: "call_available_space",
  };
  
  const inputRef = useRef(null);
  const [inputValue, setValue] = useState('');
  const [total_space, set_total_space] = useState(0.0);
  
  listen('window_is_visible', (event) => {
    console.log(event);
     if (event.payload) {
        console.log('colehinog');
        inputRef.current.focus();
     }
  
  });
  
  listen('update_total_space', (event) => {
    console.log(event)
    set_total_space(event.payload);
  });
 

  return (
      <div className="w-full max-w-2xl absolute top-5 bg-gradient-to-b from-[#3A82F7]/80 to-[#3A82F7]/40 p-1 rounded-2xl shadow-2xl z-1 shadow-blue-500/10">
      
        <div className="bg-[#1A1D2A] rounded-xl">

          {/* Cabeçalho: Barra de Pesquisa e Relógio */}
          <header className="flex items-center justify-between p-3 border-b border-white/10">
            <div className="flex items-center gap-3 w-full">
              <Search className="text-gray-500" size={20} />
              <input
                ref={inputRef}
                value={inputValue}
                onInput={(e) => {setValue(e.target.value)}}
                type="text"
                placeholder="Search or type a command..."
                className="w-full bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none text-lg"
              />
            </div>
            <Clock />
          </header>

          <section className="pl-5 pt-2 text-gray-500" > 
            {Object.values(widgets).filter((item) => item.includes(inputValue) && inputValue != '').map((item) => (
              <>
                <p key={Math.random(100) * 50 / 100} className="">{item} | {item == 'call_total_space' ? total_space : 10.0}</p>
                <br />
              </>
            ))}
          </section>

          {/* Rodapé: Navegação e Comandos */}
          <footer className="flex items-center justify-between p-3 text-gray-400 text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ArrowUpDown size={16} />
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <CornerDownLeft size={16} />
                <span>Select</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <KeyShortcut>esc</KeyShortcut>
              <span>Close</span>
            </div>
          </footer>
        </div>
      </div>
  )
};


const Overlay = () => {

  useEffect(() => {

    const handleClick = (event) => {
        invoke('hide_window');
    }
    
    const handleKey = (event) => {
       console.log(event);
       
       if (event.key == 'Escape'){
         invoke('hide_window');
       }
      
    }
  
    const overlay = document.getElementById("overlay");
    overlay.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKey);
    
    console.log("bcd");
    return () => {
      overlay.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKey);
    }
  
  }, []);

  return (
    <div id="overlay" className="opacity-50 bg-black/30 w-full h-full absolute z-0" ></div>
  )
}

function App(){
  return (
   <section className="flex justify-center items-start w-full h-full">
      <Command />
      <Overlay /> 
   </section>
  )
}


export default App
