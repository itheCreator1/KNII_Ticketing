#!/bin/sh
# Script to fix ticket validator tests

FILE="tests/unit/validators/ticketValidators.test.js"

# Replace all instances of reporter_email with reporter_department and reporter_desk
sed -i "s/reporter_email: 'test@example\.com'/reporter_department: 'IT Support',\n          reporter_desk: 'Manager'/g" "$FILE"
sed -i "s/reporter_email: 'reporter@example\.com'/reporter_department: 'IT Support',\n          reporter_desk: 'Manager'/g" "$FILE"
sed -i "s/reporter_email: 'invalid-email'/reporter_department: 'Invalid Department'/g" "$FILE"
sed -i "s/reporter_email: longEmail/reporter_department: 'IT Support',\n          reporter_desk: 'Manager'/g" "$FILE"

# Remove reporter_email test cases
sed -i "/should fail when reporter_email is invalid/,/^    });/d" "$FILE"
sed -i "/should fail when reporter_email exceeds maximum length/,/^    });/d" "$FILE"

# Change reporter_name to optional
sed -i "/should fail when reporter_name is missing/,/^    });/c\\
    it('should pass when reporter_name is missing (optional)', async () => {\n      // Arrange\n      const req = createMockRequest({\n        body: {\n          title: 'Title',\n          description: 'Description',\n          reporter_department: 'IT Support',\n          reporter_desk: 'Manager',\n          priority: 'medium'\n        }\n      });\n\n      // Act\n      const result = await runValidators(validateTicketCreation, req);\n\n      // Assert\n      expect(result.isEmpty()).toBe(true);\n    });" "$FILE"

echo "Test file updated"
