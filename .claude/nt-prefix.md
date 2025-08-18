I want to update the advanced plotting commands so that they all start with $NT: and then "PLOT". $NT will serve as a prefix for all commands in the future, not just plotting commands. Change the way the buffer processing works in advanced mode so that:

* It looks for "$NT" and if found, it starts putting data into the graphing buffer. It will keep appending to the buffer until either it finds an unescaped ";" or the buffer is full. If the buffer fills up, clear the buffer and start over. If ; is found, process the buffer as a plot command.

Don't support a legacy "PLOT:" command, only support "$NT:PLOT" from now on.
