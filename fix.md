> git push -u origin main
remote: error: GH013: Repository rule violations found for refs/heads/main.        
remote: 
remote: - GITHUB PUSH PROTECTION        
remote:   —————————————————————————————————————————        
remote:     Resolve the following violations before pushing again        
remote: 
remote:     - Push cannot contain secrets        
remote: 
remote:             
remote:      (?) Learn how to resolve a blocked push        
remote:      https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection/working-with-push-protection-from-the-command-line#resolving-a-blocked-push        
remote:             
remote:             
remote:       —— GitHub SSH Private Key ————————————————————————————        
remote:        locations:        
remote:          - blob id: 425518a066b38d8489116505a378abd28f7bd6b8        
remote:             
remote:        (?) To push, remove secret from commit(s) or follow this URL to allow the secret.        
remote:        https://github.com/Rokan0-0/realtime-guestbook/security/secret-scanning/unblock-secret/35Qf5GugYlfPbpg2lEJksNpji19        
remote:             
remote:             
remote:     ——[ WARNING ]—————————————————————————————————————————        
remote:      Scan incomplete: This push was large and we didn't finish on time.        
remote:      It can still contain undetected secrets.        
remote:             
remote:      (?) Use the following command to find the path of the detected secret(s):        
remote:          git rev-list --objects --all | grep blobid        
remote:     ——————————————————————————————————————————————————————        
remote: 
remote: 
To https://github.com/Rokan0-0/realtime-guestbook.git
 ! [remote rejected]   main -> main (push declined due to repository rule violations)
error: failed to push some refs to 'https://github.com/Rokan0-0/realtime-guestbook.git'
