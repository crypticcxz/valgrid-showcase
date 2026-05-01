import builtins
import os
import re
import subprocess
import sys


original_import = builtins.__import__
installed = set()
package_name = re.compile(r"^[A-Za-z][A-Za-z0-9_-]*$")


def install(name):
    package = name.split(".", 1)[0]
    if package.startswith("_") or not package_name.match(package):
        return False
    if package in installed:
        return False
    installed.add(package)
    env = os.environ.copy()
    env["PIP_BREAK_SYSTEM_PACKAGES"] = "1"
    try:
        subprocess.check_call(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "--disable-pip-version-check",
                package,
            ],
            env=env,
        )
    except subprocess.CalledProcessError:
        return False
    return True


def importing(name, globals=None, locals=None, fromlist=(), level=0):
    try:
        return original_import(name, globals, locals, fromlist, level)
    except ModuleNotFoundError as error:
        if level != 0 or not error.name:
            raise
        if not install(error.name):
            raise
        return original_import(name, globals, locals, fromlist, level)


builtins.__import__ = importing

exec(compile(sys.stdin.read(), "<strategy>", "exec"), {"__name__": "__main__"})
