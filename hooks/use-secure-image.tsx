import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function useSecureImageUrl(secureUrl: string | null) {
    const session = useSession();
    const [imageUrl, setImageUrl] = useState<string | null>();
    useEffect(() => {
        if (secureUrl && session.data) {
            /* //console.log("secureUrl", secureUrl)
                  fetch(secureUrl, {
                      headers: {
                          Authorization: `Bearer ${session.data.user.accessToken}`
                      }
                  })
                      .then(resp => resp.text())
                      .then(img => {
                          //console.log("image url", URL.createObjectURL(new Blob([img])))
                      })
                      .catch(e => {
                          //console.log("Image error", e)
                      }) */
            /* fetchClient.request("get", "/api/v1/users/profile-image/{fileName}", {
                      params: {
                          path: {
                              fileName: secureUrl.split("/").pop() as string
                          },
                          headers: {
                              accept: "image/jpg"
                          }
                      }
                  }).then(resp=>{
                      //console.log(new Blob([resp.data!]))
                  }); */
        }
        /* (async () => {
                if (secureUrl) {
                    const 
                    const image = await fetchClient.GET("/api/v1/users/profile-image/{fileName}", {
                        params: {
                            path: {
                                fileName: secureUrl.split("/").pop() as string
                            },
                            headers:{
                                accept: "image/jpg"
                            }
                        }
                    });
                    //console.log("secureImage", image)
                    if (!image.error) {
                        // const blob = new Blob([image as string])
                    }
                }
            })(); */
    }, [session]);

    return imageUrl;
}
