use sysinfo::{Disks};


pub struct INFO {
    pub disk: String,
    pub total_space: f64,
    pub available_space: f64,
}


pub fn get_spaces() -> INFO {
    let mut disks = Disks::new();
    
    disks.refresh(true);
    
    let mut infos: INFO = INFO {disk: "null".to_string(), total_space: 0.0, available_space: 0.0};

    for disk in disks.list() {
        let disk_size_gb: f64 = disk.total_space() as f64 / (1024.0 * 1024.0 * 1024.0);
        let disk_available_gb: f64 = disk.available_space() as f64 / (1024.0 * 1024.0 * 1024.0);
        
        infos.disk = format!("{:?}", disk.name());
        infos.total_space = disk_size_gb;
        infos.available_space = disk_available_gb;
        
    }
    
    return infos;
    
}