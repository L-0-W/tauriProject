import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface DragSystem {
    dragging: bool;
}


const dataContext = createContext<dataContextType>({ DragSystem: {}});

const controlDragMethod = (setDrag, dragging) => {

  const updateDragging = (action: bool) => {
    setDrag(() => action);
  };

  
  return {
    updateDragging,
    setDrag,
    dragging
  }

}

const useStates = () => {
  
  const [dragging, setDragging] = useState<Drag>({
    dragging: false,
  });
 
    
  const controlDragging = controlDragMethod(setDragging, dragging);

  
  return {
    controlDragging,
  };
}


export function DataProvider({ children }: { children: ReactNode }) {
    const {dragging, updateDragging} = useStates().controlDragging;

    return (
        <dataContext.Provider value={{ dragging, updateDragging }}>
            {children}
        </dataContext.Provider>
    );
}

export function useDragging() {
    return useContext(dataContext).updateDragging;
}

export function getDragging() {
    return useContext(dataContext).dragging;
}



