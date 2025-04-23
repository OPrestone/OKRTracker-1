{pkgs}: {
  deps = [
    pkgs.php82Packages.composer-local-repo-plugin
    pkgs.php
    pkgs.lsof
    pkgs.maven
  ];
}
