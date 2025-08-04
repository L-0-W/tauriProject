use tauri::{
  menu::{Menu, MenuItem},
  tray::{TrayIconBuilder},
  Manager,
  Position
};

use std::sync::{Arc, atomic::{AtomicBool, Ordering}, Mutex};
use std::thread;
use std::time::Duration;

use std::process::Command;

use windows::{
   Win32::UI::WindowsAndMessaging::*,
   Win32::Foundation::*,
};

struct WindowsCount {
  count: Mutex<i32>,
}

struct MouseTrackerState {
    running: Arc<AtomicBool>,
}
 
 
#[tauri::command]
fn iniciate_game(_app: tauri::AppHandle) {
  tauri::async_runtime::spawn(async move {
     let _output = Command::new("../src-zig/zig-out/bin/hello.exe")
      .output()
      .expect("não foi pssoveil executar arquivo");  
  });
}

#[tauri::command(rename_all = "snake_case")]
fn start_moving_window(app: tauri::AppHandle, state: tauri::State<'_, MouseTrackerState>, x: i32, y: i32, window_name: String) {
 
  println!("teste start moving");
  let running = state.running.clone();
  running.store(true, Ordering::SeqCst);
  
  tauri::async_runtime::spawn(async move {
        while running.load(Ordering::SeqCst) {
            track_mouse_pos(&app, x, y, &window_name);
            thread::sleep(Duration::from_millis(16));
        }
  });

}

#[tauri::command]
fn stop_moving_window(_app: tauri::AppHandle, state: tauri::State<'_, MouseTrackerState>) {
  println!("stop_move");
  let running = state.running.clone();
  running.store(false, Ordering::SeqCst);
  
}

fn track_mouse_pos(app: &tauri::AppHandle, x: i32, y: i32, window_name: &String) {

  #[cfg(target_os = "windows")]
  {

    let mut point = POINT { x: 0, y: 0 };
    
    
    unsafe{
      GetCursorPos(&mut point).expect("error");
    
      let window = app.get_webview_window(&window_name).unwrap();
      window.set_position(Position::Physical((point.x - x, point.y - y).into())).expect("aa")
    
    }
       
  }

}


#[tauri::command(rename_all = "snake_case")]
async fn open_new_window(app: tauri::AppHandle, windows_count: tauri::State<'_, WindowsCount>,  width: f64, height: f64, window_name: String) -> Result<bool, ()> {
  
  println!("{}", window_name);
 
  let mut windows_count = windows_count.count.lock().unwrap();
 
  let webview_url = tauri::WebviewUrl::App(format!("/{}", window_name).into());
  
  {
    tauri::WebviewWindowBuilder::new(
      &app,
      format!("{}-{}", window_name, windows_count),
      webview_url.clone(),
    )
    .transparent(true)
    .decorations(false)
    .inner_size(width, height) 
    .resizable(false)
    .shadow(false)
    .skip_taskbar(true)
    .always_on_top(true)
    .additional_browser_args("--enable-unsafe-webgpu") 
    .build()
    .expect("Falha ao criar janela de configuração");
  }
  
  *windows_count+=1;
  
  Ok(true)
}

fn main() {
  tauri::Builder::default()
    .manage(MouseTrackerState {
        running: Arc::new(AtomicBool::new(false)),
    })
    .manage(WindowsCount {
      count: Mutex::new(0),
    })
    .invoke_handler(tauri::generate_handler![open_new_window, start_moving_window, stop_moving_window, iniciate_game])
    .setup(|app| {
    
      #[cfg(desktop)]
      {
      
      use tauri_plugin_global_shortcut::{
        Code, 
        GlobalShortcutExt, 
        Modifiers, 
        Shortcut, 
        ShortcutState
      };
      
      let ctrl_n_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyN);
      
      let quit_i = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&quit_i])?; 

      
      // CASO ESTIVER MOVENDO E CLICLAR  'ctrl_n' FIXAR O APP NO LOCAL


      app.handle().plugin(
        tauri_plugin_global_shortcut::Builder::new()
          .with_handler(move |_app, shortcut, event| {
          println!("{:?}", shortcut);
          
          if shortcut == &ctrl_n_shortcut {
            match event.state() {
              ShortcutState::Pressed => {
                  toggle_window(_app, "toggle".to_string());
                  println!("Ctrl-N Pressed");        
              }
              
              ShortcutState::Released => {
                  println!("Ctrl-N Released!");        
              }
            }
          } else if shortcut == &ctrl_n_shortcut &&  running.load
          
        })
        .build(),
      )?;
      
     app.global_shortcut().register_multiple([ctrl_n_shortcut])?;
      
      TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
          "toggle" => {
            toggle_window(app, "toggle".to_string());
          }
          "quit" => {
            std::process::exit(0);
          }
          _ => {}
        })
        .build(app)?;
    
      }


      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("Erro ao iniciar o app Tauri");
}


fn toggle_window(app: &tauri::AppHandle, action: String ) {
  
  
  if let Some(window) = app.get_webview_window("main") {
    
    // if action == "close" { window.hide().unwrap() }

  
    if action != "toggle" {return;}
      
    
  
    let is_visible = window.is_visible().unwrap_or(false);
     
    if is_visible {
      window.hide().unwrap();
    } else {
      window.show().unwrap();
      window.set_focus().unwrap();
      window.center().unwrap();
    }
  }


}
