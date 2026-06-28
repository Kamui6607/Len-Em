const fs = require('fs');
const path = 'd:\\FPT\\ky7\\EXE101\\my-project\\Yarn-Shop\\FE\\src\\app\\pages\\Profile.tsx';
// Read the file
let content = fs.readFileSync(path, 'utf8');

// Add imports at top
content = content.replace(
  'import { useState, useCallback } from "react";',
  ''
);
const newImports = [
  'import { useState, useCallback } from "react";',
  'import { useNavigate } from "react-router";',
  'import { toast } from "sonner";',
  'import { authService } from "../../services/auth.service";',
  'import { userService } from "../../features/users/services/user.service";',
  'import { normalizeApiUserProfile } from "../../types/auth.types";',
  'import { useAuthStore } from "../../store/auth.store";',
].join('\n');

content = newImports + '\n' + content;

// Remove duplicate import lines
const lines = content.split('\n');
const seen = new Set();
const deduped = lines.filter(line => {
  if (line.startsWith('import ') && seen.has(line)) return false;
  if (line.startsWith('import ')) seen.add(line);
  return true;
});
content = deduped.join('\n');

// Add navigate and state after useMembershipStore(). Remove duplicate lines
content = content.replace(
  /const \{ user, signOut \} = useAuth\(\);\s*const \{ data \} = useMembershipStore\(\);\s*const navigate = useNavigate\(\);\s*/,
  'const { user, signOut } = useAuth();\n  const { data } = useMembershipStore();\n  const navigate = useNavigate();\n'
);

// Add state declarations after the existing state declarations section
content = content.replace(
  /const \[changingPwd, setChangingPwd\] = useState\(false\);\s*\n\s*if \(!user\) return null;/s,
  'const [changingPwd, setChangingPwd] = useState(false);\n\n  if (!user) return null;'
);

// Make Edit button onClick = handleEditClick
content = content.replace(
  /<button className="flex items-center gap-1\.5 px-3 py-1\.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-muted-foreground mb-0\.5">\s*<Pencil className="w-3 h-3" \/>\s*Edit\s*<\/button>/,
  '<button onClick={handleEditClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-muted-foreground mb-0.5">\n                    <Pencil className="w-3 h-3" />\n                    Edit\n                  </button>'
);

// Add handleEditClick function
content = content.replace(
  /const isDashboardUser = user\.roleId === "admin" \|\| user\.roleId === "staff";/,
  'const isDashboardUser = user.roleId === "admin" || user.roleId === "staff";\n\n  const handleEditClick = useCallback(() => {\n    setEditForm({\n      fullName: user.fullName || "",\n      phone: user.phone || "",\n      address: user.address || "",\n      gender: user.gender || "OTHER",\n      dateOfBirth: user.dateOfBirth || "",\n    });\n    setEditMode(true);\n  }, [user]);'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
