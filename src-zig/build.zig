const std = @import("std");
const sokol = @import("sokol");
const Build = std.Build;
const OptimizeMode = std.builtin.OptimizeMode;

const Options = struct {
    mod: *Build.Module,
    dep_sokol: *Build.Dependency,
    shdc_step: *Build.Step,
};

pub fn build(b: *Build) !void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});
    const dep_sokol = b.dependency("sokol", .{
        .target = target,
        .optimize = optimize,
    });
    
    const dep_win32 = b.dependency("win32", .{});
    
    const mod_sokol = dep_sokol.module("sokol");
    const mod_win32 = dep_win32.module("win32");
    const dep_shdc = dep_sokol.builder.dependency("shdc", .{});   
    const shdc_step = try sokol.shdc.createSourceFile(b, .{
        .shdc_dep = dep_shdc,
        .input = "src/shaders/shader.glsl",
        .output = "src/shaders/shader.glsl.zig",
        .slang = .{
            .glsl410 = true,
            .glsl300es = true,
            .hlsl4 = true,
            .metal_macos = true,
            .wgsl = true,
        },
    });

    const mod_test = b.createModule(.{
          .root_source_file = b.path("src/main.zig"),
          .target = target,
          .optimize = optimize,
          .imports = &.{
          .{ .name = "sokol", .module = mod_sokol },
          .{ .name = "win32", .module = mod_win32 },
       },
    });
        
    const opts = Options{ .mod = mod_test, .dep_sokol = dep_sokol, .shdc_step = shdc_step };
    if (target.result.cpu.arch.isWasm()) {
        try buildWeb(b, opts);
    } else {
        try buildNative(b, opts);
    }
}

fn buildNative(b: *Build, opts: Options) !void {
    const hello = b.addExecutable(.{
        .name = "hello",
        .root_module = opts.mod,
    });
    
    hello.step.dependOn(opts.shdc_step);
    
    b.installArtifact(hello);
    const run = b.addRunArtifact(hello);
    b.step("run", "Run hello").dependOn(&run.step);
}

fn buildWeb(b: *Build, opts: Options) !void {
    
    const lib = b.addLibrary(.{
        .name = "hello",
        .root_module = opts.mod,
    });
    

    const emsdk = opts.dep_sokol.builder.dependency("emsdk", .{});
    const link_step = try sokol.emLinkStep(b, .{
        .lib_main = lib,
        .target = opts.mod.resolved_target.?,
        .optimize = opts.mod.optimize.?,
        .emsdk = emsdk,
        .use_webgl2 = true,
        .use_emmalloc = true,
        .use_filesystem = false,
        .shell_file_path = opts.dep_sokol.path("src/sokol/web/shell.html"),
    });
    
    b.getInstallStep().dependOn(&link_step.step);
    
    const run = sokol.emRunStep(b, .{ .name = "hello", .emsdk = emsdk });
    run.step.dependOn(&link_step.step);
    b.step("run", "Run hello").dependOn(&run.step);

}
