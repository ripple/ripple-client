require 'capistrano/node-deploy'
require 'capistrano/ext/multistage'

set :stages, %w(staging production)

set :application, "ripple-client"
set :scm, :none
set :repository, "build/bundle/web"
set :deploy_via, :copy

set :use_sudo, false
set :user, "ubuntu"
set :group, "www-data"

set :deploy_to, "/srv/ripple/"

namespace :node do
  task :install_packages do
    #no-op
  end
  task :check_upstart_config do
    #no-op
  end
  task :create_upstart_config do
    #no-op
  end
  task :start do
    #no-op
  end
  task :restart do
    #no-op
  end
end
