#!/bin/bash

# Replace all instances of bg-sidebar-primary with bg-primary
sed -i 's/bg-sidebar-primary/bg-primary/g' client/src/components/sidebar.tsx

# Replace all instances of text-gray-600 hover:bg-muted with text-muted-foreground hover:bg-muted hover:text-foreground
sed -i 's/text-gray-600 hover:bg-muted/text-muted-foreground hover:bg-muted hover:text-foreground/g' client/src/components/sidebar.tsx

# Replace all instances of text-gray-600 hover:text-gray-900 with text-muted-foreground hover:text-foreground
sed -i 's/text-gray-600 hover:text-gray-900/text-muted-foreground hover:text-foreground/g' client/src/components/sidebar.tsx

# Replace all instances of text-gray-500 with text-muted-foreground
sed -i 's/text-gray-500/text-muted-foreground/g' client/src/components/sidebar.tsx

# Replace all instances of text-gray-400 with text-muted-foreground
sed -i 's/text-gray-400/text-muted-foreground/g' client/src/components/sidebar.tsx

chmod +x fix-sidebar-darkmode.sh
./fix-sidebar-darkmode.sh
