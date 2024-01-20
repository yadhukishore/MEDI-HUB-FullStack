
$("#sidebar-toggle").click(function () {
    $("#sidebar").toggle();
});


document.querySelectorAll('.apply-delete-btn').forEach(button => {
    button.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent the default behavior of the link

        const productId = event.target.getAttribute('data-product-id');
        const productName = event.target.getAttribute('data-product-name');

        Swal.fire({
            title: `Are you sure to delete ${productName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
            showLoaderOnConfirm: true, // Show loader during async operation
            preConfirm: () => {
                // Perform the asynchronous delete operation
                return fetch(`/admin/delete_product/${productId}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(response.statusText);
                        }
                    })
                    .catch(error => {
                        Swal.showValidationMessage(`Error: ${error}`);
                    });
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: `${productName} deleted successfully!`,
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Reload the current page after displaying the success message
                    location.reload();
                });
            }
        });
    });
});
