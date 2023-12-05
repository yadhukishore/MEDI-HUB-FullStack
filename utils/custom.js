// // custom.js
// document.addEventListener('DOMContentLoaded', function () {
//     const input = document.getElementById('productImages');
//     const cropperImage = document.getElementById('croppedImage');

//     input.addEventListener('change', function () {
//         const file = this.files[0];
//         const reader = new FileReader();

//         reader.onload = function (e) {
//             // Display the selected image for cropping
//             cropperImage.src = e.target.result;
//             cropperImage.style.display = 'block';

//             // Initialize Cropper.js
//             const cropper = new Cropper(cropperImage, {
//                 aspectRatio: 1, // Set your desired aspect ratio
//                 crop: function (event) {
//                     // Update hidden input fields with crop data if needed
//                 },
//             });
//         };

//         reader.readAsDataURL(file);
//     });
// });

// function validateForm() {
//     // Add any additional form validation logic here
//     return true; // Return false to prevent the form from submitting
// }
