#!/usr/bin/perl
#

#
# This script gets called after a full mozilla build & test.
# Use this to build and test an embedded or commercial branding of Mozilla.
#
# ./build-seamonkey-utils.pl will call PostMozilla::main() after
# a successful build and testing of mozilla.  This package can report
# status via the $TinderUtils::build_status variable.  Yeah this is a hack,
# but it works for now.  Feel free to improve this mechanism to properly
# return values & stuff.  -mcafee
#

use strict;

package PostMozilla;


sub main {
  TinderUtils::print_log "Post-Mozilla build goes here.\n";

  #
  # Build script goes here.
  #

  # Report some kind of status to parent script.
  #
  #  if ($status != 0) {
  #	   $TinderUtils::build_status = 'busted';
  #  } elsif (not TinderUtils::BinaryExists("/u/mcafee/gnome/galeon/src/galeon-bin")) {
  #	   TinderUtils::print_log "Error: binary not found: /u/mcafee/gnome/galeon/src/galeon-bin\n";
  #	   $TinderUtils::build_status = 'busted';
  #  } else {
  #    $TinderUtils::build_status = 'success';
  #  }

  # Report a fake success, for example's sake.
  $TinderUtils::build_status = 'success';
}

# Need to end with a true value, (since we're using "require").
1;
