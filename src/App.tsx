import { useRef, useEffect, useState, forwardRef } from 'react';
import * as THREE from 'three';
import { invoke } from '@tauri-apps/api/core';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { getCurrentWindow } from "@tauri-apps/api/window";

import "./App.css";


// TYPES DECLARATION
type Function = () => void;   



function ThreeScene() {
  const mountRef = useRef(); 

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement); // Adiciona ao container React

    const geometry = new THREE.BoxGeometry(3, 3, 3);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    
    scene.add(cube);
    camera.position.z = 5;

    const animate = () => {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    
    renderer.setAnimationLoop(animate);
    renderer.setClearColor(0xffffff, 0);

    const handleResize = () => {
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
    };
    
    const click = false;

    const handleMouseDown = (event) => {
      console.log('Mouse X:', event.clientX, 'Mouse Y:', event.clientY);
        
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      let intersects = raycaster.intersectObjects(scene.children);
      
      if (intersects.length > 0) {
        console.log(intersects[0]);
        
        ( async () => { 
        
        let windowName = await getCurrentWindow().label;
        
        console.log(windowName);
        
        console.log("handleMouse")
        invoke("start_moving_window", {x: event.clientX, y: event.clientY, window_name: windowName});
        

        })();
        

      } 
      
    }
    
    const handleMouseUp = (event) => {
      console.log("UP");
      invoke("stop_moving_window");
    }
    

    
    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
 


    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);

      
      renderer.dispose(); // Libera recursos da GPU
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '100vh' 
      }} 
    />
  );
}

const handle_windows = (element: string) => {
    
    element === 'box' ? invoke('open_new_window', { width: 130, height: 130, window_name: 'settings' })
      .then(() => console.log('Completed!')) : ''
    
    element === 'game' ? invoke('iniciate_game') : ''
}

const closeWindow = () => {
  let window = getCurrentWindow();
  
  ( async () => {
    
    await window.isVisible() === true ? await window.hide() : '';
  
  })();
  
}


const HomePage = forwardRef((props, ref) => {
  const [inputValue, setInputValue] = useState('');
  
  let handleKeyPress: Function = () => {};
  
  
  useEffect(() => {
    handleKeyPress = (event) => {
    
     if (event.key === 'Escape') {
       closeWindow();
     }
   
     if (event.key === 'Enter') {
       console.log(inputValue);
       handle_windows(inputValue);
     }
    
    }

    window.addEventListener('keydown', handleKeyPress)
  
  return () => {
    window.removeEventListener('keydown', handleKeyPress)   
  }
        
  }, [inputValue])
     

  return (
    <div id="container">
      <input  ref={ref} value={inputValue} onChange={(e) => setInputValue(e.target.value)} type="text" placeholder="Pesquise" />
    </div>
   )
});

const SettingsPage = () => {
  
  return (
    <ThreeScene />
  )
}

function App() {
  const input_ref = useRef(null); 

  useEffect(() => {

        
    return () => {
      input_ref.current?.focus();
    };
  }, [])



  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage ref={input_ref} />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
