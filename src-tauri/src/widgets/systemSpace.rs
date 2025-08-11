use sysinfo::{Disks, System};

struct INFO {
    disk: String,
    size: f64,
}

pub fn total_space() -> INFO {
    let mut disks = Disks::new();
    
    disks.refresh_list();
    disks.refresh();
    
    for disk in disks.list() {
        let disk_size_in_gb: f64 = disk.total_space() as f64 / (1024 * 1024 * 1024);
        
        return { INFO {
            disk: disk.name(),
            size: disk_size_in_gb,
        }}
    }
    
}