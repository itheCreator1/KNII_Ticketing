/**
 * User Form - Department Field Visibility and Validation
 * Handles showing/hiding department field based on role selection
 * Works for both create.ejs and edit.ejs templates
 */

document.addEventListener('DOMContentLoaded', function () {
  const roleSelect = document.getElementById('role');
  const deptField = document.getElementById('department-field');
  const deptSelect = document.getElementById('department');
  const form = document.getElementById('createUserForm');

  // Only run if core elements exist (role select and department field)
  if (!roleSelect || !deptField || !deptSelect) {
    return;
  }

  /**
   * Toggle department field visibility based on role selection
   * Show field and make required when role = 'department'
   * Hide field and clear value when role = 'admin' or 'super_admin'
   */
  roleSelect.addEventListener('change', function () {
    if (this.value === 'department') {
      deptField.style.display = 'block';
      deptSelect.required = true;
    } else {
      deptField.style.display = 'none';
      deptSelect.required = false;
      deptSelect.value = ''; // Clear value when hiding
    }
  });

  /**
   * Client-side validation on form submit (create form only)
   * Prevents form submission if department role selected but no department chosen
   * Only adds listener if form exists (create.ejs has form ID, edit.ejs doesn't)
   */
  if (form) {
    form.addEventListener('submit', function (e) {
      if (roleSelect.value === 'department' && !deptSelect.value) {
        e.preventDefault();
        alert('Please select a department for department role users');
        deptSelect.focus();
        return false;
      }
    });
  }
});
