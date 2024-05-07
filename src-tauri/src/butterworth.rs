use image::{Luma,ImageEncoder};
use image::codecs::png::PngEncoder;
use image::io::Reader as ImageReader;
use butter2d::butterworth;
use std::io::Cursor;
use tauri::command;
fn convert_to_grayscale(img: &image::RgbImage) -> image::GrayImage {
    let mut gray_img = image::GrayImage::new(img.width(), img.height());
    for (x, y, rgb) in img.enumerate_pixels() {
        let luma = (0.299 * rgb[0] as f64 + 0.587 * rgb[1] as f64 + 0.114 * rgb[2] as f64) as u8;
        gray_img.put_pixel(x, y, Luma([luma]));
    }
    println!("Grayscale conversion completed.");
    gray_img
}
#[command]
pub fn apply_butterworth_filter(
    image_buffer: Vec<u8>,
    cutoff_frequency_ratio: f64,
    high_pass: bool,
    order: f64,
    squared: bool,
    npad: usize
) -> Result<Vec<u8>, String> {
    let img = ImageReader::new(Cursor::new(image_buffer))
        .with_guessed_format()
        .map_err(|e| e.to_string())?
        .decode()
        .map_err(|e| e.to_string())?;
    println!("Image decoded successfully.");
    let rgb_img = img.to_rgb8();
    let gray_img = convert_to_grayscale(&rgb_img);
    let (filtered_img, _) = butterworth(
        &gray_img,
        cutoff_frequency_ratio,
        high_pass,
        order,
        squared,
        npad
    );
    println!("Butterworth filter applied.");
    let mut buf = Vec::new();
    let encoder = PngEncoder::new(&mut buf);
    encoder.write_image(
        filtered_img.as_raw(),
        filtered_img.width(),
        filtered_img.height(),
        image::ColorType::L8.into()
    ).map_err(|e| e.to_string())?;
    println!("Image encoding attempted with buffer size: {}", buf.len());

    if buf.is_empty() {
        return Err("Failed to generate image data.".to_string());
    }
    Ok(buf)
}
