import { useSites } from '@/hooks/sites';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Job } from '../../../../supabase/functions/_shared/types';
import { Skeleton } from '../ui/skeleton';

/**
 * Job details component.
 */
export function JobDetails({ job, isScrapingDescription }: { job: Job; isScrapingDescription: boolean }) {
  const { sites } = useSites();
  const site = sites.find((site) => site.id === job.siteId);

  return isScrapingDescription ? (
    // Description is being fetched
    <div>
      <Skeleton className="mb-3 h-4 w-3/4" />
      <Skeleton className="mb-3 h-4 w-4/5" />
      <Skeleton className="mb-3 h-4 w-2/5" />

      <p className="my-8 text-center">
        Hang tight, we are fetching the job description from {site?.name ?? 'the source'}
        <br />
        It can take up to a couple of minutes.
      </p>

      <Skeleton className="mb-3 h-4 w-full" />
      <Skeleton className="mb-3 h-4 w-4/5" />
      <Skeleton className="mb-3 h-4 w-2/3" />
      <Skeleton className="mb-3 h-4 w-5/6" />
    </div>
  ) : job.description ? (
    // Description has been fetched
    <Markdown remarkPlugins={[remarkGfm]} className="job-description-md pl-[25px] pr-2">
      {job.description}
    </Markdown>
  ) : (
    // Description failed to fetch
    <div className="mt-20 text-center">
      <p className="">Looks like we have failed to fetch the job description and for that we are sorry {':('}</p>
      <p>
        You can read it directly on{' '}
        <a className="text-primary" href={job.externalUrl}>
          {site?.name ?? 'the source'}
        </a>{' '}
        though.
      </p>

      {/* Light mode svg */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        data-name="Layer 1"
        width="1119.60911"
        height="699"
        viewBox="0 0 1119.60911 699"
        className="mx-auto my-10 h-fit w-2/3 dark:hidden"
      >
        <title>server down</title>
        <circle cx="292.60911" cy="213" r="213" fill="#f2f2f2" />
        <path
          d="M31.39089,151.64237c0,77.49789,48.6181,140.20819,108.70073,140.20819"
          transform="translate(-31.39089 -100.5)"
          fill="#2f2e41"
        />
        <path
          d="M140.09162,291.85056c0-78.36865,54.255-141.78356,121.30372-141.78356"
          transform="translate(-31.39089 -100.5)"
          fill="#809966"
        />
        <path
          d="M70.77521,158.66768c0,73.61476,31.00285,133.18288,69.31641,133.18288"
          transform="translate(-31.39089 -100.5)"
          fill="#809966"
        />
        <path
          d="M140.09162,291.85056c0-100.13772,62.7103-181.16788,140.20819-181.16788"
          transform="translate(-31.39089 -100.5)"
          fill="#2f2e41"
        />
        <path
          d="M117.22379,292.83905s15.41555-.47479,20.06141-3.783,23.713-7.2585,24.86553-1.95278,23.16671,26.38821,5.76263,26.5286-40.43935-2.711-45.07627-5.53549S117.22379,292.83905,117.22379,292.83905Z"
          transform="translate(-31.39089 -100.5)"
          fill="#a8a8a8"
        />
        <path
          d="M168.224,311.78489c-17.40408.14042-40.43933-2.71094-45.07626-5.53548-3.53126-2.151-4.93843-9.86945-5.40926-13.43043-.32607.014-.51463.02-.51463.02s.97638,12.43276,5.61331,15.2573,27.67217,5.67589,45.07626,5.53547c5.02386-.04052,6.7592-1.82793,6.66391-4.47526C173.87935,310.756,171.96329,311.75474,168.224,311.78489Z"
          transform="translate(-31.39089 -100.5)"
          opacity="0.2"
        />
        <ellipse cx="198.60911" cy="424.5" rx="187" ry="25.43993" fill="#3f3d56" />
        <ellipse cx="198.60911" cy="424.5" rx="157" ry="21.35866" opacity="0.1" />
        <ellipse cx="836.60911" cy="660.5" rx="283" ry="38.5" fill="#3f3d56" />
        <ellipse cx="310.60911" cy="645.5" rx="170" ry="23.12721" fill="#3f3d56" />
        <path
          d="M494,726.5c90,23,263-30,282-90"
          transform="translate(-31.39089 -100.5)"
          fill="none"
          stroke="#2f2e41"
          stroke-miterlimit="10"
          strokeWidth="2"
        />
        <path
          d="M341,359.5s130-36,138,80-107,149-17,172"
          transform="translate(-31.39089 -100.5)"
          fill="none"
          stroke="#2f2e41"
          stroke-miterlimit="10"
          strokeWidth="2"
        />
        <path
          d="M215.40233,637.78332s39.0723-10.82,41.47675,24.04449-32.15951,44.78287-5.10946,51.69566"
          transform="translate(-31.39089 -100.5)"
          fill="none"
          stroke="#2f2e41"
          stroke-miterlimit="10"
          strokeWidth="2"
        />
        <path
          d="M810.09554,663.73988,802.218,714.03505s-38.78182,20.60284-11.51335,21.20881,155.73324,0,155.73324,0,24.84461,0-14.54318-21.81478l-7.87756-52.719Z"
          transform="translate(-31.39089 -100.5)"
          fill="#2f2e41"
        />
        <path
          d="M785.21906,734.69812c6.193-5.51039,16.9989-11.252,16.9989-11.252l7.87756-50.2952,113.9216.10717,7.87756,49.582c9.185,5.08711,14.8749,8.987,18.20362,11.97818,5.05882-1.15422,10.58716-5.44353-18.20362-21.38921l-7.87756-52.719-113.9216,3.02983L802.218,714.03506S769.62985,731.34968,785.21906,734.69812Z"
          transform="translate(-31.39089 -100.5)"
          opacity="0.1"
        />
        <rect x="578.43291" y="212.68859" width="513.25314" height="357.51989" rx="18.04568" fill="#2f2e41" />
        <rect x="595.70294" y="231.77652" width="478.71308" height="267.83694" fill="#3f3d56" />
        <circle cx="835.05948" cy="223.29299" r="3.02983" fill="#f2f2f2" />
        <path
          d="M1123.07694,621.32226V652.6628a18.04341,18.04341,0,0,1-18.04568,18.04568H627.86949A18.04341,18.04341,0,0,1,609.8238,652.6628V621.32226Z"
          transform="translate(-31.39089 -100.5)"
          fill="#2f2e41"
        />
        <polygon
          points="968.978 667.466 968.978 673.526 642.968 673.526 642.968 668.678 643.417 667.466 651.452 645.651 962.312 645.651 968.978 667.466"
          fill="#2f2e41"
        />
        <path
          d="M1125.828,762.03359c-.59383,2.539-2.83591,5.21743-7.90178,7.75032-18.179,9.08949-55.1429-2.42386-55.1429-2.42386s-28.4804-4.84773-28.4804-17.573a22.72457,22.72457,0,0,1,2.49658-1.48459c7.64294-4.04351,32.98449-14.02122,77.9177.42248a18.73921,18.73921,0,0,1,8.54106,5.59715C1125.07908,756.45353,1126.50669,759.15715,1125.828,762.03359Z"
          transform="translate(-31.39089 -100.5)"
          fill="#2f2e41"
        />
        <path
          d="M1125.828,762.03359c-22.251,8.526-42.0843,9.1622-62.43871-4.975-10.26507-7.12617-19.59089-8.88955-26.58979-8.75618,7.64294-4.04351,32.98449-14.02122,77.9177.42248a18.73921,18.73921,0,0,1,8.54106,5.59715C1125.07908,756.45353,1126.50669,759.15715,1125.828,762.03359Z"
          transform="translate(-31.39089 -100.5)"
          opacity="0.1"
        />
        <ellipse cx="1066.53846" cy="654.13477" rx="7.87756" ry="2.42386" fill="#f2f2f2" />
        <circle cx="835.05948" cy="545.66686" r="11.51335" fill="#f2f2f2" />
        <polygon
          points="968.978 667.466 968.978 673.526 642.968 673.526 642.968 668.678 643.417 667.466 968.978 667.466"
          opacity="0.1"
        />
        <rect x="108.60911" y="159" width="208" height="242" fill="#2f2e41" />
        <rect x="87.60911" y="135" width="250" height="86" fill="#3f3d56" />
        <rect x="87.60911" y="237" width="250" height="86" fill="#3f3d56" />
        <rect x="87.60911" y="339" width="250" height="86" fill="#3f3d56" />
        <rect x="271.60911" y="150" width="16" height="16" fill="#809966" opacity="0.4" />
        <rect x="294.60911" y="150" width="16" height="16" fill="#809966" opacity="0.8" />
        <rect x="317.60911" y="150" width="16" height="16" fill="#809966" />
        <rect x="271.60911" y="251" width="16" height="16" fill="#809966" opacity="0.4" />
        <rect x="294.60911" y="251" width="16" height="16" fill="#809966" opacity="0.8" />
        <rect x="317.60911" y="251" width="16" height="16" fill="#809966" />
        <rect x="271.60911" y="352" width="16" height="16" fill="#809966" opacity="0.4" />
        <rect x="294.60911" y="352" width="16" height="16" fill="#809966" opacity="0.8" />
        <rect x="317.60911" y="352" width="16" height="16" fill="#809966" />
        <circle cx="316.60911" cy="538" r="79" fill="#2f2e41" />
        <rect x="280.60911" y="600" width="24" height="43" fill="#2f2e41" />
        <rect x="328.60911" y="600" width="24" height="43" fill="#2f2e41" />
        <ellipse cx="300.60911" cy="643.5" rx="20" ry="7.5" fill="#2f2e41" />
        <ellipse cx="348.60911" cy="642.5" rx="20" ry="7.5" fill="#2f2e41" />
        <circle cx="318.60911" cy="518" r="27" fill="#fff" />
        <circle cx="318.60911" cy="518" r="9" fill="#3f3d56" />
        <path
          d="M271.36733,565.03228c-6.37889-28.56758,14.01185-57.43392,45.544-64.47477s62.2651,10.41,68.644,38.9776-14.51861,39.10379-46.05075,46.14464S277.74622,593.59986,271.36733,565.03228Z"
          transform="translate(-31.39089 -100.5)"
          fill="#809966"
        />
        <ellipse
          cx="417.21511"
          cy="611.34365"
          rx="39.5"
          ry="12.40027"
          transform="translate(-238.28665 112.98044) rotate(-23.17116)"
          fill="#2f2e41"
        />
        <ellipse
          cx="269.21511"
          cy="664.34365"
          rx="39.5"
          ry="12.40027"
          transform="translate(-271.07969 59.02084) rotate(-23.17116)"
          fill="#2f2e41"
        />
        <path
          d="M394,661.5c0,7.732-19.90861,23-42,23s-43-14.268-43-22,20.90861-6,43-6S394,653.768,394,661.5Z"
          transform="translate(-31.39089 -100.5)"
          fill="#fff"
        />
      </svg>

      {/* Dark mode svg */}
      <svg
        width="1120"
        height="699"
        viewBox="0 0 1120 699"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mx-auto my-10 hidden h-fit w-2/3 dark:block"
      >
        <g clipPath="url(#clip0_2001_2)">
          <path
            d="M292.609 426C410.246 426 505.609 330.637 505.609 213C505.609 95.3633 410.246 0 292.609 0C174.972 0 79.6091 95.3633 79.6091 213C79.6091 330.637 174.972 426 292.609 426Z"
            fill="#222222"
          />
          <path d="M0 51.1426C0 128.64 48.6181 191.351 108.701 191.351Z" fill="#717171" />
          <path d="M108.701 191.35C108.701 112.982 162.956 49.5669 230.004 49.5669Z" fill="#809966" />
          <path d="M39.3843 58.1675C39.3843 131.782 70.3872 191.35 108.701 191.35Z" fill="#809966" />
          <path d="M108.701 191.35C108.701 91.2128 171.411 10.1826 248.909 10.1826Z" fill="#717171" />
          <path
            d="M85.8329 192.339C85.8329 192.339 101.248 191.864 105.894 188.556C110.54 185.248 129.607 181.298 130.76 186.603C131.912 191.909 153.927 212.991 136.522 213.132C119.118 213.272 96.0831 210.421 91.4462 207.596C86.8093 204.772 85.8329 192.339 85.8329 192.339Z"
            fill="#A8A8A8"
          />
          <path
            opacity="0.2"
            d="M136.833 211.285C119.429 211.425 96.3938 208.574 91.7568 205.749C88.2256 203.598 86.8184 195.88 86.3476 192.319C86.0215 192.333 85.8329 192.339 85.8329 192.339C85.8329 192.339 86.8093 204.772 91.4463 207.596C96.0832 210.421 119.118 213.272 136.523 213.132C141.546 213.091 143.282 211.304 143.186 208.656C142.488 210.256 140.572 211.255 136.833 211.285Z"
            fill="black"
          />
          <path
            d="M198.609 449.94C301.886 449.94 385.609 438.55 385.609 424.5C385.609 410.45 301.886 399.06 198.609 399.06C95.3319 399.06 11.6091 410.45 11.6091 424.5C11.6091 438.55 95.3319 449.94 198.609 449.94Z"
            fill="#222222"
          />
          <path
            opacity="0.1"
            d="M198.609 445.858C285.318 445.858 355.609 436.296 355.609 424.5C355.609 412.704 285.318 403.141 198.609 403.141C111.9 403.141 41.6091 412.704 41.6091 424.5C41.6091 436.296 111.9 445.858 198.609 445.858Z"
            fill="black"
          />
          <path
            d="M836.609 699C992.906 699 1119.61 681.763 1119.61 660.5C1119.61 639.237 992.906 622 836.609 622C680.313 622 553.609 639.237 553.609 660.5C553.609 681.763 680.313 699 836.609 699Z"
            fill="#222222"
          />
          <path
            d="M310.609 668.627C404.498 668.627 480.609 658.273 480.609 645.5C480.609 632.727 404.498 622.373 310.609 622.373C216.721 622.373 140.609 632.727 140.609 645.5C140.609 658.273 216.721 668.627 310.609 668.627Z"
            fill="#222222"
          />
          <path
            d="M462.609 626C552.609 649 725.609 596 744.609 536"
            stroke="#717171"
            strokeWidth="2"
            stroke-miterlimit="10"
          />
          <path
            d="M309.609 259C309.609 259 439.609 223 447.609 339C455.609 455 340.609 488 430.609 511"
            stroke="#717171"
            strokeWidth="2"
            stroke-miterlimit="10"
          />
          <path
            d="M184.011 537.283C184.011 537.283 223.084 526.463 225.488 561.328C227.893 596.192 193.329 606.111 220.379 613.023"
            stroke="#717171"
            strokeWidth="2"
            stroke-miterlimit="10"
          />
          <path
            d="M778.705 563.24L770.827 613.535C770.827 613.535 732.045 634.138 759.314 634.744C786.582 635.35 915.047 634.744 915.047 634.744C915.047 634.744 939.892 634.744 900.504 612.929L892.626 560.21L778.705 563.24Z"
            fill="#717171"
          />
          <path
            opacity="0.1"
            d="M753.828 634.198C760.021 628.688 770.827 622.946 770.827 622.946L778.705 572.651L892.626 572.758L900.504 622.34C909.689 627.427 915.379 631.327 918.707 634.318C923.766 633.164 929.295 628.875 900.504 612.929L892.626 560.21L778.705 563.24L770.827 613.535C770.827 613.535 738.239 630.85 753.828 634.198Z"
            fill="black"
          />
          <path
            d="M1073.64 212.688H596.479C586.512 212.688 578.433 220.768 578.433 230.734V552.163C578.433 562.129 586.512 570.208 596.479 570.208H1073.64C1083.61 570.208 1091.69 562.129 1091.69 552.163V230.734C1091.69 220.768 1083.61 212.688 1073.64 212.688Z"
            fill="#717171"
          />
          <path d="M1074.42 231.776H595.703V499.613H1074.42V231.776Z" fill="#CCCCCC" />
          <path
            d="M835.06 226.323C836.733 226.323 838.089 224.966 838.089 223.293C838.089 221.62 836.733 220.263 835.06 220.263C833.386 220.263 832.03 221.62 832.03 223.293C832.03 224.966 833.386 226.323 835.06 226.323Z"
            fill="#222222"
          />
          <path
            d="M1091.69 520.822V552.163C1091.69 554.533 1091.22 556.879 1090.31 559.069C1089.41 561.258 1088.08 563.248 1086.4 564.924C1084.73 566.599 1082.74 567.929 1080.55 568.835C1078.36 569.742 1076.01 570.209 1073.64 570.208H596.479C594.109 570.209 591.762 569.742 589.572 568.835C587.383 567.929 585.393 566.599 583.718 564.924C582.042 563.248 580.713 561.258 579.806 559.069C578.899 556.879 578.433 554.533 578.433 552.163V520.822H1091.69Z"
            fill="#717171"
          />
          <path
            d="M968.978 667.466V673.526H642.968V668.678L643.417 667.466L651.452 645.651H962.312L968.978 667.466Z"
            fill="#717171"
          />
          <path
            d="M1094.44 661.533C1093.84 664.072 1091.6 666.751 1086.54 669.284C1068.36 678.373 1031.39 666.86 1031.39 666.86C1031.39 666.86 1002.91 662.012 1002.91 649.287C1003.71 648.739 1004.55 648.243 1005.41 647.802C1013.05 643.759 1038.39 633.781 1083.33 648.225C1086.64 649.264 1089.59 651.201 1091.87 653.822C1093.69 655.953 1095.12 658.657 1094.44 661.533Z"
            fill="#717171"
          />
          <path
            opacity="0.1"
            d="M1094.44 661.533C1072.19 670.059 1052.35 670.696 1032 656.558C1021.73 649.432 1012.41 647.669 1005.41 647.802C1013.05 643.759 1038.39 633.781 1083.33 648.225C1086.64 649.264 1089.59 651.201 1091.87 653.822C1093.69 655.953 1095.12 658.657 1094.44 661.533Z"
            fill="black"
          />
          <path
            d="M1066.54 656.559C1070.89 656.559 1074.42 655.473 1074.42 654.135C1074.42 652.796 1070.89 651.711 1066.54 651.711C1062.19 651.711 1058.66 652.796 1058.66 654.135C1058.66 655.473 1062.19 656.559 1066.54 656.559Z"
            fill="#222222"
          />
          <path
            d="M835.06 557.18C841.418 557.18 846.573 552.025 846.573 545.667C846.573 539.308 841.418 534.153 835.06 534.153C828.701 534.153 823.546 539.308 823.546 545.667C823.546 552.025 828.701 557.18 835.06 557.18Z"
            fill="#222222"
          />
          <path opacity="0.1" d="M968.978 667.466V673.526H642.968V668.678L643.417 667.466H968.978Z" fill="black" />
          <path d="M316.609 159H108.609V401H316.609V159Z" fill="#717171" />
          <path d="M337.609 135H87.6091V221H337.609V135Z" fill="#CCCCCC" />
          <path d="M337.609 237H87.6091V323H337.609V237Z" fill="#CCCCCC" />
          <path d="M337.609 339H87.6091V425H337.609V339Z" fill="#CCCCCC" />
          <path opacity="0.4" d="M287.609 150H271.609V166H287.609V150Z" fill="#809966" />
          <path opacity="0.8" d="M310.609 150H294.609V166H310.609V150Z" fill="#809966" />
          <path d="M333.609 150H317.609V166H333.609V150Z" fill="#809966" />
          <path opacity="0.4" d="M287.609 251H271.609V267H287.609V251Z" fill="#809966" />
          <path opacity="0.8" d="M310.609 251H294.609V267H310.609V251Z" fill="#809966" />
          <path d="M333.609 251H317.609V267H333.609V251Z" fill="#809966" />
          <path opacity="0.4" d="M287.609 352H271.609V368H287.609V352Z" fill="#809966" />
          <path opacity="0.8" d="M310.609 352H294.609V368H310.609V352Z" fill="#809966" />
          <path d="M333.609 352H317.609V368H333.609V352Z" fill="#809966" />
          <path
            d="M316.609 617C360.24 617 395.609 581.63 395.609 538C395.609 494.37 360.24 459 316.609 459C272.979 459 237.609 494.37 237.609 538C237.609 581.63 272.979 617 316.609 617Z"
            fill="#717171"
          />
          <path d="M304.609 600H280.609V643H304.609V600Z" fill="#717171" />
          <path d="M352.609 600H328.609V643H352.609V600Z" fill="#717171" />
          <path
            d="M300.609 651C311.655 651 320.609 647.642 320.609 643.5C320.609 639.358 311.655 636 300.609 636C289.563 636 280.609 639.358 280.609 643.5C280.609 647.642 289.563 651 300.609 651Z"
            fill="#717171"
          />
          <path
            d="M348.609 650C359.655 650 368.609 646.642 368.609 642.5C368.609 638.358 359.655 635 348.609 635C337.563 635 328.609 638.358 328.609 642.5C328.609 646.642 337.563 650 348.609 650Z"
            fill="#717171"
          />
          <path
            d="M318.609 545C333.521 545 345.609 532.912 345.609 518C345.609 503.088 333.521 491 318.609 491C303.697 491 291.609 503.088 291.609 518C291.609 532.912 303.697 545 318.609 545Z"
            fill="white"
          />
          <path
            d="M318.609 527C323.58 527 327.609 522.971 327.609 518C327.609 513.029 323.58 509 318.609 509C313.639 509 309.609 513.029 309.609 518C309.609 522.971 313.639 527 318.609 527Z"
            fill="black"
          />
          <path
            d="M239.976 464.532C233.598 435.965 253.988 407.098 285.52 400.057C317.053 393.017 347.786 410.467 354.164 439.035C360.543 467.603 339.646 478.139 308.114 485.18C276.582 492.221 246.355 493.1 239.976 464.532Z"
            fill="#809966"
          />
          <path
            d="M390.704 522.244C410.759 513.66 424.833 501.597 422.138 495.301C419.443 489.005 401.001 490.86 380.945 499.444C360.89 508.028 346.816 520.09 349.511 526.386C352.205 532.682 370.648 530.828 390.704 522.244Z"
            fill="#717171"
          />
          <path
            d="M242.703 575.244C262.759 566.66 276.833 554.597 274.138 548.301C271.443 542.005 253 543.86 232.945 552.444C212.889 561.028 198.816 573.09 201.51 579.386C204.205 585.682 222.648 583.828 242.703 575.244Z"
            fill="#717171"
          />
          <path
            d="M362.609 561C362.609 568.732 342.701 584 320.609 584C298.518 584 277.609 569.732 277.609 562C277.609 554.268 298.518 556 320.609 556C342.701 556 362.609 553.268 362.609 561Z"
            fill="white"
          />
        </g>
        <defs>
          <clipPath id="clip0_2001_2">
            <rect width="1119.61" height="699" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
