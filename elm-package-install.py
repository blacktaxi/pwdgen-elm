#!/usr/bin/env python2.7
import tempfile, os, sys, shutil, json
from subprocess import call

ELM_STUFF = 'elm-stuff'
DOWNLOAD_CACHE = os.path.join(ELM_STUFF, 'package-cache')
DEPS_PATH = 'exact-dependencies.json'

def download_to(url, fileName):
    call('curl -L -o "{fileName}" "{url}"'.format(**locals()), shell=True)

def download_package(package, version, cache=True):
    print 'Fetching package {} @ {}'.format(package, version)
    tarball_url = 'http://github.com/{}/archive/{}.tar.gz'.format(package, version)
    download_path = os.path.join(DOWNLOAD_CACHE, '{}-{}'.format(package.replace('/', '+'), version))

    if (not cache) or (not (os.path.exists(download_path) and os.path.getsize(download_path) > 0)):
        if not os.path.exists(DOWNLOAD_CACHE): os.makedirs(DOWNLOAD_CACHE)

        print 'Downloading {}...'.format(tarball_url)
        download_to(tarball_url, download_path)

    return download_path

def untargz_to(archive, dest_dir):
    call(
        'gzip -dc {0} | tar -xf - -C {1}'.format(os.path.abspath(archive), os.path.abspath(dest_dir)),
        shell=True)

def retry_on_fail(times, action):
    try:
        return action()
    except Exception as e:
        if times > 0: return retry_on_fail(times - 1, action)
        else: raise

def install_single(package, version):
    print 'Installing {package}-{version}...'.format(**locals())

    # make sure elm-stuff exists
    if not os.path.exists(ELM_STUFF):
        os.makedirs(ELM_STUFF)

    # remove the installed package, if any
    pkg_dir = os.path.join(ELM_STUFF, "packages", package, version)
    if os.path.exists(pkg_dir):
        shutil.rmtree(pkg_dir)

    tmpdir = tempfile.mkdtemp()

    try:
        targz_file = retry_on_fail(10, lambda: download_package(package, version))

        print 'Unpacking...'
        untargz_to(targz_file, tmpdir)

        print "Copying to %s" % (pkg_dir)
        # the tar.gz will consist of a single dir, named PROJECT-VERSION
        package_root = os.path.join(tmpdir, '{0}-{1}'.format(package.split('/')[1], version))
        shutil.copytree(package_root, pkg_dir)
    finally:
        shutil.rmtree(tmpdir)

def install_packages(deps):
    print 'Will install following packages:'
    print '\n'.join(map(lambda x: '- ' + repr(x), deps.iteritems()))

    for pkg, ver in deps.iteritems():
        install_single(pkg, ver)

def write_exact_dependencies(deps):
    print 'Writing exact-dependencies.json...'
    with open(os.path.join(ELM_STUFF, 'exact-dependencies.json'), 'w') as f:
        json.dump(deps, f)

if __name__ == '__main__':
    with open(DEPS_PATH, 'r+') as f:
        deps = json.load(f)

    install_packages(deps)
    write_exact_dependencies(deps)

    print 'All done!'
