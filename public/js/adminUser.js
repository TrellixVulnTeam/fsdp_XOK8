var $table = $('#table')
function generate_actions(value, row, index) {
  return `
<div>
  <a href="/admin/deleteUser/${row.id}"><i class="bi bi-trash"></i></a>
</div>`
    ;
}