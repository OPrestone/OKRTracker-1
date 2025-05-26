#!/bin/bash
sed -i 's/tenant?.id/currentTenant?.id/g' client/src/pages/objective-detail.tsx
sed -i 's/tenant.id/currentTenant.id/g' client/src/pages/objective-detail.tsx
